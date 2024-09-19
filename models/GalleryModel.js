const { getDB } = require("../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");
const cron = require("node-cron");
const { createError } = require("../services/responseHandler");

const COLLECTION_NAME = "gallery";
const COLLECTION_SCHEMA = Joi.object({
  image_uri: Joi.string().required(),
  type: Joi.string().required(),
  ratio: Joi.string().required(),
  path: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  status: Joi.string().valid("upcoming", "ongoing", "expired").required(),
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

const GalleryModel = {
  createImage: async (imageData) => {
    return handleDBOperation(async (collection) => {
      validateData(imageData);
      const result = await collection.insertOne(imageData);
      if (!result.insertedId) {
        throw createError(
          "Failed to create image",
          500,
          "IMAGE_CREATION_FAILED"
        );
      }
      return result.insertedId;
    });
  },

  deleteImage: async (image_id) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.deleteOne({
        _id: new ObjectId(image_id),
      });
      if (result.deletedCount === 0) {
        throw createError("Image not found", 404, "IMAGE_NOT_FOUND");
      }
      return result;
    });
  },

  getImageById: async (image_id) => {
    return handleDBOperation(async (collection) => {
      const image = await collection.findOne({ _id: new ObjectId(image_id) });
      if (!image) {
        throw createError("Image not found", 404, "IMAGE_NOT_FOUND");
      }
      return image;
    });
  },

  updateImagePath: async (image_id, newPath) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(image_id) },
        {
          $set: {
            path: newPath,
            updated_at: new Date(),
          },
        },
        { returnDocument: "after" }
      );
      if (!result.value) {
        throw createError("Image not found", 404, "IMAGE_NOT_FOUND");
      }
      return result.value;
    });
  },

  getFilteredAndSortedImages: async (filters, sortOptions, pagination) => {
    return handleDBOperation(async (collection) => {
      let query = {};
      if (filters.type) query.type = filters.type;
      if (filters.ratio) query.ratio = filters.ratio;
      if (filters.status) query.status = filters.status;
      if (filters.currentDate) {
        const now = new Date();
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };
      }
      if (filters.startDate || filters.endDate) {
        query.startDate = query.startDate || {};
        query.endDate = query.endDate || {};
        if (filters.startDate)
          query.startDate.$gte = new Date(filters.startDate);
        if (filters.endDate) query.endDate.$lte = new Date(filters.endDate);
      }
      if (filters.keyword) {
        query.path = { $regex: filters.keyword, $options: "i" };
      }
      let sort = {};
      if (sortOptions && sortOptions.field) {
        sort[sortOptions.field] = sortOptions.order === "desc" ? -1 : 1;
      }
      const totalCount = await collection.countDocuments(query);
      const images = await collection
        .find(query)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .toArray();

      return {
        images,
        totalCount,
        currentPage: pagination.page,
        totalPages: Math.ceil(totalCount / pagination.limit),
      };
    });
  },

  changeStatusDaily: async () => {
    return handleDBOperation(async (collection) => {
      const now = new Date();
      await collection.updateMany(
        {
          status: "upcoming",
          startDate: { $lte: now },
        },
        { $set: { status: "ongoing", updated_at: now } }
      );

      await collection.updateMany(
        {
          status: "ongoing",
          endDate: { $lt: now },
        },
        { $set: { status: "expired", updated_at: now } }
      );

      console.log("Daily status update completed successfully.");
    });
  },
};

cron.schedule("0 0 * * *", async () => {
  console.log("Running daily status update...");
  try {
    await GalleryModel.changeStatusDaily();
  } catch (error) {
    console.error("Error in daily status update:", error);
  }
});

module.exports = GalleryModel;
