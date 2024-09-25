const { ConversationModel, MessageModel } = require("../models");
const { getUserById } = require("../queue/producers/user-producer");
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
      const conversation =
        await ConversationModel.getConversation(conversation_id);

      const seller = await getUserById(conversation.seller_id, "seller");
      const customer = await getUserById(conversation.customer_id, "customer");

      return {
        ...conversation,
        seller_username: seller.username,
        customer_username: customer.username,
      };
    }),

  getListConversationByUserId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const user_id = req.user._id.toString();
      const role = req.user.role;
      const conversations = await ConversationModel.getListConversationByUserId(
        user_id,
        role
      );

      const enhancedConversations = await Promise.all(
        conversations.map(async (conversation) => {
          const seller = await getUserById(conversation.seller_id, "seller");
          const customer = await getUserById(
            conversation.customer_id,
            "customer"
          );

          return {
            ...conversation,
            seller_username: seller.username,
            customer_username: customer.username,
          };
        })
      );

      return enhancedConversations;
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
