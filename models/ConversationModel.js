const { getDB } = require("../config/mongoDB");
const Joi = require("joi");
const { createError } = require("../services/responseHandler");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "conversation";
const COLLECTION_SCHEMA = Joi.object({
  customer_id: Joi.string().required(),
  seller_id: Joi.string().required(),
  last_message: Joi.string().required(),
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

const ConversationModel = {
  createConversation: async (seller_id, customer_id) => {
    return handleDBOperation(async (collection) => {
      const conversation = await collection.findOne({ seller_id, customer_id });
      if (conversation) {
        return conversation;
      }
      const result = await collection.insertOne({
        customer_id,
        seller_id,
        last_message: "",
        created_at: new Date(),
        updated_at: new Date(),
      });
      return result.insertedId;
    });
  },

  getConversation: async (conversation_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.findOne({
        _id: new ObjectId(conversation_id),
      });
    });
  },

  getListConversationByUserId: async (user_id) => {
    return handleDBOperation(async (collection) => {
      return await collection
        .find({ $or: [{ customer_id: user_id }, { seller_id: user_id }] })
        .toArray();
    });
  },

  clearConversation: async (conversation_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.deleteOne({ _id: new ObjectId(conversation_id) });
    });
  },
};

module.exports = ConversationModel;
