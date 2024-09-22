const { getDB } = require("../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");
const { createError } = require("../services/responseHandler");

const COLLECTION_NAME = "notification_preferences";
const COLLECTION_SCHEMA = Joi.object({
  user_id: Joi.string().required(),
  role: Joi.string().required(),
  preferences: Joi.object().required(),
}).options({ abortEarly: false });

const validateNotification = (data) => {
  const { error } = COLLECTION_SCHEMA.validate(data);
  if (error) {
    throw createError(
      `Validation error: ${error.details.map((d) => d.message).join(", ")}`,
      400,
      "VALIDATION_ERROR"
    );
  }
};

const handleDBOperation = async (operation) => {
  const db = await getDB();
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

const NotificationPreferencesModel = {
  newNotificationPreferences: async (userId, role) => {
    return handleDBOperation(async (collection) => {
      if (role === "customer") {
        const preferencesData = {
          order_notification: true,
          marketing_notification: true,
          message_notification: true,
          feedback_notification: true,
          email_notification: true,
          account_notification: true,
          other_notification: true,
        };
        const result = await collection.insertOne({
          user_id: userId,
          role: role,
          preferences: preferencesData,
        });
        return result;
      } else if (role === "seller") {
        const preferencesData = {
          order_notification: true,
          product_notification: true,
          discount_notification: true,
          message_notification: true,
          feedback_notification: true,
          email_notification: true,
          account_notification: true,
          payment_notification: true,
          marketing_notification: true,
          revenue_notification: true,
          other_notification: true,
        };
        const result = await collection.insertOne({
          user_id: userId,
          role: role,
          preferences: preferencesData,
        });
        return result;
      }
    });
  },

  getAllowNotificationPreferences: async (userId, role) => {
    return handleDBOperation(async (collection) => {
      const userPreferences = await collection.findOne({
        user_id: userId,
        role: role,
      });
      if (!userPreferences || !userPreferences.preferences) {
        return [];
      }
      return Object.entries(userPreferences.preferences)
        .filter(([_, value]) => value === true)
        .map(([key]) => key);
    });
  },

  getNotificationPreferences: async (userId, role) => {
    return handleDBOperation(async (collection) => {
      const userPreferences = await collection.findOne({
        user_id: userId,
        role: role,
      });
      return userPreferences;
    });
  },

  updateNotificationPreferences: async (userId, role, preferences_name) => {
    // example: preferences_name = "feedback_notification", if feedback_notification is true then toggle to false and vice versa
    return handleDBOperation(async (collection) => {
      const userPreferences = await collection.findOne({
        user_id: userId,
        role,
      });
      if (!userPreferences) {
        throw createError("User preferences not found", 404, "USER_NOT_FOUND");
      }
      const { preferences } = userPreferences;
      const updatedPreferences = {
        ...preferences,
        [preferences_name]: !preferences[preferences_name],
      };
      await collection.updateOne(
        { user_id: userId },
        { $set: { preferences: updatedPreferences } }
      );
      return updatedPreferences;
    });
  },
};

module.exports = NotificationPreferencesModel;
