const express = require("express");
const { NotificationPreferencesController } = require("../controllers");
const { authToken } = require("../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "get",
    path: "/preferences",
    middleware: [authToken],
    handler: NotificationPreferencesController.getNotificationPreferences,
  },
  {
    method: "put",
    path: "/preferences/:preferences_name",
    middleware: [authToken],
    handler: NotificationPreferencesController.updateNotificationPreferences,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
