const { connectRabbitMQ } = require("../config/rabbitmq");
const { OTPModel } = require("../models");

const OTP_QUEUE = "otp_queue";

const startOTPConsumer = async () => {
  try {
    const channel = await connectRabbitMQ();
    await channel.assertQueue(OTP_QUEUE, { durable: false });

    console.log("OTP Consumer waiting for messages...");

    channel.consume(OTP_QUEUE, async (msg) => {
      if (msg !== null) {
        const { action, data } = JSON.parse(msg.content.toString());

        switch (action) {
          case "storeOTP":
            await OTPModel.storeOTP(data.email, data.otp, data.role);
            break;
          case "verifyOTP":
            const result = await OTPModel.verifyOTP(
              data.email,
              data.otp,
              data.role
            );
            channel.sendToQueue(
              msg.properties.replyTo,
              Buffer.from(JSON.stringify({ result })),
              {
                correlationId: msg.properties.correlationId,
              }
            );
            break;
          default:
            console.log("Unknown action:", action);
        }

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error("Error in OTP consumer:", error);
  }
};

module.exports = { startOTPConsumer };
