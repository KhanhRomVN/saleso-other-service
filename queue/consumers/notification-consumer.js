const amqp = require("amqplib");
const { NotificationModel } = require("../../models");

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const CREATE_NOTIFICATION_QUEUE = "create_notification_queue";

async function startCreateNotificationConsumer() {
  let connection;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(CREATE_NOTIFICATION_QUEUE, { durable: true });
    channel.prefetch(1);
    channel.consume(
      CREATE_NOTIFICATION_QUEUE,
      async (msg) => {
        if (msg !== null) {
          const notificationData = JSON.parse(msg.content.toString());

          try {
            await NotificationModel.createNotification(notificationData);
            channel.ack(msg);
          } catch (error) {
            console.error("Error processing notification:", error);
            // If processing fails, requeue the message after 5 seconds
            setTimeout(() => {
              channel.nack(msg);
            }, 5000);
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("Error in consumer:", error);
    // Try to reconnect after 5 seconds if there's an error
    setTimeout(startCreateNotificationConsumer, 5000);
  }
}

module.exports = { startCreateNotificationConsumer };
