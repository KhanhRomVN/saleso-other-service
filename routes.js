const gallery = require("./routes/gallery.route");
const notification = require("./routes/notification.route");
const notification_preferences = require("./routes/notification-preferences.route");
const session = require("./routes/session.route");
const message = require("./routes/message.route");
const conversation = require("./routes/conversation.route");

module.exports = {
  gallery,
  session,
  notification,
  notification_preferences,
  message,
  conversation,
};
