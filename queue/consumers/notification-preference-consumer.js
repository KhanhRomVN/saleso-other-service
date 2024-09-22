const amqp = require("amqplib");
const { NotificationPreferencesModel } = require("../../models");

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const NEW_PREFERENCE_QUEUE = "notification_preferences_queue";
const GET_ALLOW_PREFERENCE_QUEUE = "get_allow_notification_preferences_queue";

// use only for register new account
async function startNotificationPreferenceConsumer() {
  let connection;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(NEW_PREFERENCE_QUEUE, { durable: true });
    console.log(`Waiting for messages in queue: ${NEW_PREFERENCE_QUEUE}`);

    channel.prefetch(1);

    channel.consume(
      NEW_PREFERENCE_QUEUE,
      async (msg) => {
        if (msg !== null) {
          const { userId, role } = JSON.parse(msg.content.toString());
          console.log(`Received message: userId=${userId}, role=${role}`);

          try {
            await NotificationPreferencesModel.newNotificationPreferences(
              userId,
              role
            );
            channel.ack(msg);
            console.log(`Processed notification preference for user ${userId}`);
          } catch (error) {
            console.error("Error processing message:", error);
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
    console.error("Error in consumer:", error);
    // Thử kết nối lại sau 5 giây nếu có lỗi
    setTimeout(startConsumer, 5000);
  }
}

async function startGetAllowNotificationPreferenceConsumer() {
  let connection;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(GET_ALLOW_PREFERENCE_QUEUE, { durable: true });
    console.log(`Waiting for messages in queue: ${GET_ALLOW_PREFERENCE_QUEUE}`);

    channel.prefetch(1);

    channel.consume(
      GET_ALLOW_PREFERENCE_QUEUE,
      async (msg) => {
        if (msg !== null) {
          const { userId, role } = JSON.parse(msg.content.toString());
          console.log(`Received message: userId=${userId}, role=${role}`);

          try {
            const allowedPreferences =
              await NotificationPreferencesModel.getAllowNotificationPreferences(
                userId,
                role
              );
            console.log(
              `Processed allowed notification preferences for user ${userId}:`,
              allowedPreferences
            );

            channel.ack(msg);
          } catch (error) {
            console.error("Error processing message:", error);
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
    console.error("Error in consumer:", error);
    // Thử kết nối lại sau 5 giây nếu có lỗi
    setTimeout(startGetAllowNotificationPreferenceConsumer, 5000);
  }
}

module.exports = {
  startNotificationPreferenceConsumer,
  startGetAllowNotificationPreferenceConsumer,
};
