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
    console.log(`Waiting for messages in queue: ${CREATE_NOTIFICATION_QUEUE}`);

    channel.prefetch(1);

    channel.consume(
      CREATE_NOTIFICATION_QUEUE,
      async (msg) => {
        if (msg !== null) {
          const notificationData = JSON.parse(msg.content.toString());
          console.log(
            `Received create notification request: ${notificationData.title}`
          );

          try {
            await NotificationModel.createNotification(notificationData);
            console.log(`Created notification: ${notificationData.title}`);

            channel.ack(msg);
          } catch (error) {
            console.error(
              "Error processing create notification message:",
              error
            );
            // Nếu xử lý thất bại, gửi lại message vào queue sau 5 giây
            setTimeout(() => {
              channel.nack(msg);
            }, 5000);
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("Error in create notification consumer:", error);
    // Thử kết nối lại sau 5 giây nếu có lỗi
    setTimeout(startCreateNotificationConsumer, 5000);
  }
}

module.exports = { startCreateNotificationConsumer };
