const { GalleryModel } = require("../models");
const { handleRequest, createError } = require("../services/responseHandler");

const determineStatus = (startDate, endDate) => {
  const now = new Date();
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  if (now.getTime() < startDate.getTime()) return "upcoming";
  if (
    now.getTime() >= startDate.getTime() &&
    now.getTime() <= endDate.getTime()
  )
    return "ongoing";
  return "expired";
};

const GalleryController = {
  createImage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { image_uri, type, ratio, path, startDate, endDate } = req.body;
      if (!image_uri || !type || !ratio || !path || !startDate || !endDate) {
        throw createError("Missing required fields", 400, "MISSING_FIELDS");
      }
      const status = determineStatus(startDate, endDate);
      const imageData = {
        image_uri,
        type,
        ratio,
        path,
        startDate,
        endDate,
        status,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await GalleryModel.createImage(imageData);
      return { success: "Create image/gallery success" };
    }),

  deleteImage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { image_id } = req.params;
      if (!image_id) {
        throw createError("Image ID is required", 400, "MISSING_IMAGE_ID");
      }
      await GalleryModel.deleteImage(image_id);
      return { success: "Delete image/gallery success" };
    }),

  getImage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { image_id } = req.params;
      if (!image_id) {
        throw createError("Image ID is required", 400, "MISSING_IMAGE_ID");
      }
      const image = await GalleryModel.getImageById(image_id);
      if (!image) {
        throw createError("Image not found", 404, "IMAGE_NOT_FOUND");
      }
      return image;
    }),

  updatePath: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { image_id } = req.params;
      const { path } = req.body;
      if (!image_id || !path) {
        throw createError(
          "Image ID and path are required",
          400,
          "MISSING_FIELDS"
        );
      }
      const updatedImage = await GalleryModel.updateImagePath(image_id, path);
      if (!updatedImage) {
        throw createError("Image not found", 404, "IMAGE_NOT_FOUND");
      }
      return { success: "Image path updated successfully", updatedImage };
    }),

  getFilteredAndSortedImages: (req, res) =>
    handleRequest(req, res, async (req) => {
      const {
        type,
        ratio,
        status,
        currentDate,
        startDate,
        endDate,
        keyword,
        sortField,
        sortOrder,
        page = 1,
        limit = 10,
      } = req.body;

      const filters = {
        type,
        ratio,
        status,
        currentDate: currentDate === "true",
        startDate,
        endDate,
        keyword,
      };

      const sortOptions = sortField
        ? { field: sortField, order: sortOrder || "asc" }
        : null;

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
      };

      const result = await GalleryModel.getFilteredAndSortedImages(
        filters,
        sortOptions,
        pagination
      );

      if (!result || result.length === 0) {
        throw createError("No images found", 404, "NO_IMAGES_FOUND");
      }

      return result;
    }),
};

module.exports = GalleryController;
