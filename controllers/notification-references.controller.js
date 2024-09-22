const { NotificationPreferencesModel } = require("../models");
const { handleRequest, createError } = require("../services/responseHandler");

const determineStatus = (startDate, endDate) => {
  const now = new Date();
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  if (now.getTime() < startDate.getTime()) return "upcoming";
  if (
    now.getTime() >= startDate.getTime() &&
    now.getTime() <= endDate.getTime()
  )
    return "ongoing";
  return "expired";
};

const NotificationPreferencesController = {
  getNotificationPreferences: (req, res) =>
    handleRequest(req, res, async (req) => {
      const user_id = req.user._id.toString();
      return await NotificationPreferencesModel.getNotificationPreferences(
        user_id,
        req.user.role
      );
    }),
  updateNotificationPreferences: (req, res) =>
    handleRequest(req, res, async (req) => {
      const user_id = req.user._id.toString();
      const preferences_name = req.params.preferences_name;
      return await NotificationPreferencesModel.updateNotificationPreferences(
        user_id,
        req.user.role,
        preferences_name
      );
    }),
};

module.exports = NotificationPreferencesController;
