const { MessageModel } = require("../models");
const { handleRequest } = require("../services/responseHandler");

const MessageController = {
  getMessages: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { conversation_id, page = 1 } = req.params;
      return await MessageModel.getMessages(conversation_id, 20, page);
    }),

  sendMessage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { conversation_id } = req.params;
      const { message, image_uri = [] } = req.body;
      const sender_id = req.user._id.toString();
      return await MessageModel.sendMessage(
        conversation_id,
        message,
        image_uri,
        sender_id
      );
    }),

  deleteMessage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { message_id } = req.params;
      return await MessageModel.deleteMessage(message_id);
    }),
};

module.exports = MessageController;
