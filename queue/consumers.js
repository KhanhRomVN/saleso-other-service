const { startOTPConsumers } = require("./consumers/otp-consumer");

const runAllConsumers = async () => {
  await startOTPConsumers();
};

module.exports = {
  runAllConsumers,
};
