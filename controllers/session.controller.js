const { SessionModel } = require("../models");
const cron = require("node-cron");
const { handleRequest, createError } = require("../services/responseHandler");

const SessionController = {
  createSessionData: (req, res) =>
    handleRequest(req, res, async (req) => {
      if (!req.user || !req.user._id) {
        throw createError("User not authenticated", 401, "UNAUTHORIZED");
      }
      const customer_id = req.user._id.toString();
      if (!req.body) {
        throw createError(
          "Session data is required",
          400,
          "MISSING_SESSION_DATA"
        );
      }
      const result = await SessionModel.createSessionData(
        req.body,
        customer_id
      );
      if (!result) {
        throw createError(
          "Failed to create session",
          500,
          "SESSION_CREATION_FAILED"
        );
      }
      return result.toString();
    }),

  getSessionData: (req, res) =>
    handleRequest(req, res, async (req) => {
      if (!req.user || !req.user._id) {
        throw createError("User not authenticated", 401, "UNAUTHORIZED");
      }
      const { session_id } = req.params;
      if (!session_id) {
        throw createError("Session ID is required", 400, "MISSING_SESSION_ID");
      }
      const customer_id = req.user._id.toString();
      const sessionData = await SessionModel.getSessionData(
        customer_id,
        session_id
      );
      if (!sessionData) {
        throw createError("Session not found", 404, "SESSION_NOT_FOUND");
      }
      return sessionData;
    }),

  cleanSession: (req, res) =>
    handleRequest(req, res, async (req) => {
      if (!req.user || !req.user._id) {
        throw createError("User not authenticated", 401, "UNAUTHORIZED");
      }
      const { session_id } = req.params;
      if (!session_id) {
        throw createError("Session ID is required", 400, "MISSING_SESSION_ID");
      }
      const customer_id = req.user._id.toString();
      const result = await SessionModel.cleanSession(customer_id, session_id);
      if (!result) {
        throw createError(
          "Failed to clean session",
          500,
          "SESSION_CLEANING_FAILED"
        );
      }
      return { message: "Session cleaned successfully" };
    }),
};

const cleanExpiredSessions = async () => {
  try {
    await SessionModel.cleanExpiredSessions();
  } catch (error) {
    console.error("Failed to clean expired sessions:", error);
  }
};

cron.schedule("* * * * *", cleanExpiredSessions);

module.exports = SessionController;
