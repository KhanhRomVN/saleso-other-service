const { NotificationModel } = require("../models");
const cron = require("node-cron");
const { handleRequest, createError } = require("../services/responseHandler");

const SessionController = {
  getNotificationByUser: (req, res) =>
    handleRequest(req, res, async (req) => {
      const user_id = req.user._id.toString();
      const role = req.user.role;
      const page = req.params.page;
      const result = await NotificationModel.getNotificationByUserId(
        user_id,
        role,
        page
      );
      return result;
    }),

  markNotificationAsRead: (req, res) =>
    handleRequest(req, res, async (req) => {
      const user_id = req.user._id.toString();
      const role = req.user.role;
      const notification_id = req.params.notification_id.toString();
      const notification = await NotificationModel.getNotificationById(
        user_id,
        role,
        notification_id
      );
      if (!notification) {
        throw createError(
          "Notification not found",
          404,
          "NOTIFICATION_NOT_FOUND"
        );
      }
      if (notification.user_id !== user_id) {
        throw createError(
          "Notification not found",
          404,
          "NOTIFICATION_NOT_FOUND"
        );
      }
      const result =
        await NotificationModel.markNotificationAsRead(notification_id);
      return result;
    }),

  deleteNotification: (req, res) =>
    handleRequest(req, res, async (req) => {
      const user_id = req.user._id.toString();
      const role = req.user.role;
      const notification_id = req.params.notification_id.toString();
      const notification = await NotificationModel.getNotificationById(
        user_id,
        role,
        notification_id
      );
      if (!notification) {
        throw createError(
          "Notification not found",
          404,
          "NOTIFICATION_NOT_FOUND"
        );
      }
      if (notification.user_id !== user_id) {
        throw createError(
          "Notification not found",
          404,
          "NOTIFICATION_NOT_FOUND"
        );
      }
      await NotificationModel.deleteNotification(notification_id);
    }),
};

module.exports = SessionController;
