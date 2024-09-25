const { getDB } = require("../config/mongoDB");
const Joi = require("joi");
const { createError } = require("../services/responseHandler");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "messages";
const COLLECTION_SCHEMA = Joi.object({
  conversation_id: Joi.string().required(),
  message: Joi.string().required(),
  image_uri: Joi.array().items(Joi.string()).optional(),
  sender_id: Joi.string().required(),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateData = (data) => {
  const { error } = COLLECTION_SCHEMA.validate(data);
  if (error) {
    throw createError(
      `Validation error: ${error.details.map((d) => d.message).join(", ")}`,
      400,
      "VALIDATION_ERROR"
    );
  }
};

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(COLLECTION_NAME));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw createError(
      `Database operation failed: ${error.message}`,
      500,
      "DB_OPERATION_FAILED"
    );
  }
};

const MessageModel = {
  sendMessage: async (conversation_id, message, image_uri, sender_id) => {
    return handleDBOperation(async (collection) => {
      await collection.insertOne({
        conversation_id,
        message,
        image_uri,
        sender_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });
  },

  getMessages: async (conversation_id, limit, page) => {
    return handleDBOperation(async (collection) => {
      const messages = await collection
        .find({ conversation_id })
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      return messages;
    });
  },

  deleteMessage: async (message_id) => {
    return handleDBOperation(async (collection) => {
      await collection.deleteOne({ _id: new ObjectId(message_id) });
    });
  },

  deleteAllMessages: async (conversation_id) => {
    return handleDBOperation(async (collection) => {
      await collection.deleteMany({ conversation_id });
    });
  },
};

module.exports = MessageModel;
