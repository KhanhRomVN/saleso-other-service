const { getDB } = require("../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");
const { createError } = require("../services/responseHandler");

const COLLECTION_NAME = "notifications";
const notificationSchema = Joi.object({
  user_id: Joi.string().required(),
  message: Joi.string().required(),
  link: Joi.string(),
  type: Joi.string().required(),
  status: Joi.string().valid("read", "unread").default("unread"),
  created_at: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateNotification = (data) => {
  const { error } = notificationSchema.validate(data);
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

const createNotification = async (notificationData) => {
  return handleDBOperation(async (collection) => {
    validateNotification(notificationData);
    const result = await collection.insertOne(notificationData);
    if (!result.insertedId) {
      throw createError(
        "Failed to create notification",
        500,
        "NOTIFICATION_CREATION_FAILED"
      );
    }
    return result.insertedId;
  });
};

const getNotifications = async (user_id) => {
  return handleDBOperation(async (collection) => {
    const notifications = await collection.find({ user_id }).toArray();
    if (!notifications || notifications.length === 0) {
      throw createError(
        "No notifications found for this user",
        404,
        "NOTIFICATIONS_NOT_FOUND"
      );
    }
    return notifications;
  });
};

const markAsRead = async (user_id, notification_id) => {
  return handleDBOperation(async (collection) => {
    const result = await collection.updateOne(
      { _id: new ObjectId(notification_id), user_id },
      { $set: { status: "read" } }
    );
    if (result.matchedCount === 0) {
      throw createError(
        "Notification not found",
        404,
        "NOTIFICATION_NOT_FOUND"
      );
    }
    if (result.modifiedCount === 0) {
      throw createError(
        "Notification already marked as read",
        400,
        "NOTIFICATION_ALREADY_READ"
      );
    }
    return result;
  });
};

const deleteNotification = async (user_id, notification_id) => {
  return handleDBOperation(async (collection) => {
    const result = await collection.deleteOne({
      _id: new ObjectId(notification_id),
      user_id,
    });
    if (result.deletedCount === 0) {
      throw createError(
        "Notification not found",
        404,
        "NOTIFICATION_NOT_FOUND"
      );
    }
    return result;
  });
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  deleteNotification,
};
