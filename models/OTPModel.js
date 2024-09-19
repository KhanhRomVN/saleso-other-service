const { getDB } = require("../config/mongoDB");
const { ObjectId } = require("mongodb");
const cron = require("node-cron");
const { createError } = require("../services/responseHandler");

const OTP_COLLECTION = "otps";

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(OTP_COLLECTION));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw createError(
      `Database operation failed: ${error.message}`,
      500,
      "DB_OPERATION_FAILED"
    );
  }
};

const OTPModel = {
  storeOTP: async (email, otp, role) => {
    return handleDBOperation(async (collection) => {
      if (!email || !otp || !role) {
        throw createError(
          "Email, OTP, and role are required",
          400,
          "MISSING_REQUIRED_FIELDS"
        );
      }

      await collection.deleteOne({ email, role });

      const result = await collection.insertOne({
        email,
        otp,
        role,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      if (!result.insertedId) {
        throw createError("Failed to store OTP", 500, "OTP_STORAGE_FAILED");
      }

      return result.insertedId;
    });
  },

  verifyOTP: async (email, otp, role) => {
    return handleDBOperation(async (collection) => {
      if (!email || !otp || !role) {
        throw createError(
          "Email, OTP, and role are required",
          400,
          "MISSING_REQUIRED_FIELDS"
        );
      }

      const otpRecord = await collection.findOne({ email, otp, role });

      if (!otpRecord) {
        throw createError("Invalid OTP", 400, "INVALID_OTP");
      }

      if (new Date() > otpRecord.expiresAt) {
        await collection.deleteOne({ _id: new ObjectId(otpRecord._id) });
        throw createError("OTP has expired", 400, "EXPIRED_OTP");
      }

      await collection.deleteOne({ _id: new ObjectId(otpRecord._id) });
      return true;
    });
  },

  cleanExpiredOTPs: async () => {
    return handleDBOperation(async (collection) => {
      await collection.deleteMany({
        expiresAt: { $lt: new Date() },
      });
    });
  },
};

// Cron job to clean expired OTPs every hour
cron.schedule("* * * * *", async () => {
  try {
    await OTPModel.cleanExpiredOTPs();
  } catch (error) {
    console.error("Error cleaning expired OTPs:", error);
  }
});

module.exports = OTPModel;
