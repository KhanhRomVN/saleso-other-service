const { getDB } = require("../config/mongoDB");
const Joi = require("joi");
const { createError } = require("../services/responseHandler");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "notifications";
const COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  // notification_type is an enum of "feedback_notification", "marketing_notification", "server_announcement"
  notification_type: Joi.string().required(),
  target_type: Joi.string()
    .valid("individual", "group", "role", "server-wide")
    .required(),
  // target_role is only required for "role" target_type
  target_role: Joi.string().valid("seller", "customer"),
  // target is an array of user ids for individual notifications and only for individual and group notifications
  target_ids: Joi.array().items(Joi.string()).required(),
  // exxample: if notification_type is "feedback_notification", related is the feedback_id
  related: Joi.object({
    path: Joi.string().optional(),
  }).optional(),
  can_delete: Joi.boolean().required(),
  can_mark_as_read: Joi.boolean().required(),
  is_read: Joi.boolean().required(),
  created_at: Joi.date().default(Date.now),
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

const NotificationModel = {
  createNotification: async (notification) => {
    validateNotification(notification);
    return handleDBOperation(async (collection) => {
      const result = await collection.insertOne(notification);

      // Send notification via SSE
      const sendSSENotification = global.sendSSENotification;
      if (sendSSENotification) {
        notification.target_ids.forEach((userId) => {
          sendSSENotification(userId, {
            ...notification,
            _id: result.insertedId,
          });
        });
      }

      return result;
    });
  },

  getNotificationByUserId: async (userId, role, page = 1) => {
    return handleDBOperation(async (collection) => {
      const query = {
        $or: [
          { target_type: "individual", target_ids: userId },
          { target_type: "group", target_ids: userId },
          { target_type: "role", target_role: role },
          { target_type: "server-wide" },
        ],
      };

      return await collection
        .find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * 5)
        .limit(5)
        .toArray();
    });
  },

  getNotificationById: async (userId, role, notificationId) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.findOne({
        _id: new ObjectId(notificationId),
        user_id: userId,
        role,
      });
      return result;
    });
  },

  markNotificationAsRead: async (notificationId) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { _id: notificationId },
        { $set: { is_read: true } }
      );
      return result;
    });
  },

  deleteNotification: async (notificationId) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.deleteOne({ _id: notificationId });
      return result;
    });
  },
};

module.exports = NotificationModel;
