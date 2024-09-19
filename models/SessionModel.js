const { getDB } = require("../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");
const { createError } = require("../services/responseHandler");

const COLLECTION_NAME = "session";

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(COLLECTION_NAME));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw createError(
      `Database operation failed: ${error.message}`,
      500,
      "DB_OPERATION_FAILED"
    );
  }
};

const SessionModel = {
  createSessionData: async (data, customer_id) => {
    return await handleDBOperation(async (collection) => {
      if (!data || !customer_id) {
        throw createError(
          "Data and customer_id are required",
          400,
          "MISSING_REQUIRED_FIELDS"
        );
      }
      const sessionData = {
        customer_id,
        data,
        created_at: new Date(),
      };
      const result = await collection.insertOne(sessionData);
      if (!result.insertedId) {
        throw createError(
          "Failed to create session",
          500,
          "SESSION_CREATION_FAILED"
        );
      }
      return result.insertedId;
    });
  },

  getSessionData: async (customer_id, session_id) => {
    const schema = Joi.object({
      customer_id: Joi.string().required(),
      session_id: Joi.string().required(),
    });

    const { error } = schema.validate({ customer_id, session_id });
    if (error) {
      throw createError(
        `Validation error: ${error.details[0].message}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    return await handleDBOperation(async (collection) => {
      const session = await collection.findOne({
        _id: new ObjectId(session_id),
        customer_id: customer_id,
      });
      if (!session) {
        throw createError("Session not found", 404, "SESSION_NOT_FOUND");
      }
      return session;
    });
  },

  cleanSession: async (customer_id) => {
    return await handleDBOperation(async (collection) => {
      if (!customer_id) {
        throw createError(
          "Customer_id is required",
          400,
          "MISSING_REQUIRED_FIELDS"
        );
      }
      const result = await collection.deleteMany({ customer_id });
      if (result.deletedCount === 0) {
        throw createError(
          "No sessions found for this customer",
          404,
          "NO_SESSIONS_FOUND"
        );
      }
      return result.deletedCount;
    });
  },

  cleanExpiredSessions: async () => {
    return await handleDBOperation(async (collection) => {
      const now = new Date();
      const expirationTime = new Date(now.getTime() - 2 * 60 * 1000);
      await collection.deleteMany({
        created_at: { $lte: expirationTime },
      });
    });
  },
};

module.exports = SessionModel;
