const { ConversationModel, MessageModel } = require("../models");
const { handleRequest } = require("../services/responseHandler");

const ConversationController = {
  createConversation: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const seller_id = req.body.seller_id;
      return await ConversationModel.createConversation(seller_id, customer_id);
    }),

  getConversation: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { conversation_id } = req.params;
      return await ConversationModel.getConversation(conversation_id);
    }),

  getListConversationByUserId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const user_id = req.user._id.toString();
      return await ConversationModel.getListConversationByUserId(user_id);
    }),

  // clear all message in conversation
  clearConversation: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { conversation_id } = req.params;
      await MessageModel.deleteAllMessages(conversation_id);
      await ConversationModel.clearConversation(conversation_id);
    }),
};

module.exports = ConversationController;
