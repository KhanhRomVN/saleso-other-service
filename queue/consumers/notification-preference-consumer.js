const amqp = require("amqplib");
const { NotificationPreferencesModel } = require("../../models");

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const NEW_PREFERENCE_QUEUE = "notification_preferences_queue";
const GET_ALLOW_PREFERENCE_QUEUE = "get_allow_notification_preferences_queue";

async function startNotificationPreferenceConsumer() {
  let connection;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(NEW_PREFERENCE_QUEUE, { durable: true });

    channel.prefetch(1);

    channel.consume(
      NEW_PREFERENCE_QUEUE,
      async (msg) => {
        if (msg !== null) {
          const { userId, role } = JSON.parse(msg.content.toString());

          try {
            await NotificationPreferencesModel.newNotificationPreferences(
              userId,
              role
            );
            channel.ack(msg);
          } catch (error) {
            console.error("Error processing message:", error);
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
    setTimeout(startNotificationPreferenceConsumer, 5000);
  }
}

async function startGetAllowNotificationPreferenceConsumer() {
  let connection;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(GET_ALLOW_PREFERENCE_QUEUE, { durable: true });

    channel.prefetch(1);

    channel.consume(GET_ALLOW_PREFERENCE_QUEUE, async (msg) => {
      if (msg !== null) {
        const { userId, role } = JSON.parse(msg.content.toString());

        try {
          const allowedPreferences =
            await NotificationPreferencesModel.getAllowNotificationPreferences(
              userId,
              role
            );

          channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify(allowedPreferences)),
            {
              correlationId: msg.properties.correlationId,
            }
          );

          channel.ack(msg);
        } catch (error) {
          console.error("Error processing message:", error);
          channel.nack(msg);
        }
      }
    });
  } catch (error) {
    console.error("Error in consumer:", error);
    setTimeout(startGetAllowNotificationPreferenceConsumer, 5000);
  }
}

module.exports = {
  startNotificationPreferenceConsumer,
  startGetAllowNotificationPreferenceConsumer,
};
