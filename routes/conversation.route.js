const express = require("express");
const { ConversationController } = require("../controllers");
const { authCustomerToken, authToken } = require("../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/create",
    middleware: [authCustomerToken],
    handler: ConversationController.createConversation,
  },
  {
    method: "get",
    path: "/:conversation_id",
    handler: ConversationController.getConversation,
  },
  {
    method: "get",
    path: "/",
    middleware: [authToken],
    handler: ConversationController.getListConversationByUserId,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
