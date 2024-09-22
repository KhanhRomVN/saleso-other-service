const { startOTPConsumers } = require("./consumers/otp-consumer");
const {
  startNotificationPreferenceConsumer,
  startGetAllowNotificationPreferenceConsumer,
} = require("./consumers/notification-preference-consumer");
const {
  startCreateNotificationConsumer,
} = require("./consumers/notification-consumer");

const runAllConsumers = async () => {
  await startOTPConsumers();
  await startNotificationPreferenceConsumer();
  await startGetAllowNotificationPreferenceConsumer();
  await startCreateNotificationConsumer();
};

module.exports = {
  runAllConsumers,
};
