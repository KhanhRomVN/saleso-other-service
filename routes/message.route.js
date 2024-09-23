const express = require("express");
const { MessageController } = require("../controllers");
const { authCustomerToken, authToken } = require("../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "get",
    path: "/:conversation_id/:page",
    middleware: [authToken],
    handler: MessageController.getMessages,
  },
  {
    method: "post",
    path: "/:conversation_id",
    middleware: [authToken],
    handler: MessageController.sendMessage,
  },
  {
    method: "delete",
    path: "/:message_id",
    middleware: [authToken],
    handler: MessageController.deleteMessage,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
