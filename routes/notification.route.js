const express = require("express");
const { NotificationController } = require("../controllers");
const { authToken } = require("../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "get",
    path: "/:page",
    middleware: [authToken],
    handler: NotificationController.getNotificationByUser,
  },
  {
    method: "put",
    path: "/mark-as-read/:notification_id",
    middleware: [authToken],
    handler: NotificationController.markNotificationAsRead,
  },
  {
    method: "delete",
    path: "/:notification_id",
    middleware: [authToken],
    handler: NotificationController.deleteNotification,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
