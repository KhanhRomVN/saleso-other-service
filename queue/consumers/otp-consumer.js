const amqp = require("amqplib");
const { OTPModel } = require("../../models");

const startOTPConsumers = async () => {
  let connection;
  let channel;
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Consumer for storeOTP
    const storeOTPQueue = "store_otp_queue";
    await channel.assertQueue(storeOTPQueue, { durable: false });

    channel.consume(storeOTPQueue, async (msg) => {
      const { email, otp, role } = JSON.parse(msg.content.toString());

      try {
        const result = await OTPModel.storeOTP(email, otp, role);
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ success: true, result })),
          { correlationId: msg.properties.correlationId }
        );
      } catch (error) {
        console.error("Error storing OTP:", error);
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ error: error.message })),
          { correlationId: msg.properties.correlationId }
        );
      }

      channel.ack(msg);
    });

    // Consumer for verifyOTP
    const verifyOTPQueue = "verify_otp_queue";
    await channel.assertQueue(verifyOTPQueue, { durable: false });

    channel.consume(verifyOTPQueue, async (msg) => {
      const { email, otp, role } = JSON.parse(msg.content.toString());

      try {
        const result = await OTPModel.verifyOTP(email, otp, role);
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ success: true, result })),
          { correlationId: msg.properties.correlationId }
        );
      } catch (error) {
        console.error("Error verifying OTP:", error);
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ error: error.message })),
          { correlationId: msg.properties.correlationId }
        );
      }

      channel.ack(msg);
    });
  } catch (error) {
    console.error("Error in OTP consumers:", error);
    if (channel) await channel.close();
    if (connection) await connection.close();
  }
};

module.exports = {
  startOTPConsumers,
};
