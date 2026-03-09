import Media from "../models/Media.js";
import { ApiError } from "../helpers/apiError.js";
import { getStorageProvider } from "./storage/index.js";
import path from "path";

/**
 * Media Service
 * 
 * Central service for all media/file operations.
 * Single source of truth for file lifecycle management.
 * 
 * All controllers should use this service - no direct filesystem or S3 logic in controllers.
 */
class MediaService {
  constructor() {
    this.storage = getStorageProvider();
  }

  /**
   * Validate file before upload
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedMimeTypes = null, // null = allow all
      allowedExtensions = null // null = allow all
    } = options;

    // Check file exists
    if (!file || !file.buffer) {
      throw new ApiError(400, "No file provided");
    }

    // Check file size
    if (file.size > maxSize) {
      throw new ApiError(400, `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
      throw new ApiError(400, `File type not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`);
    }

    // Check extension
    if (allowedExtensions) {
      const ext = path.extname(file.originalname || "").toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        throw new ApiError(400, `File extension not allowed. Allowed extensions: ${allowedExtensions.join(", ")}`);
      }
    }

    // Security: Check for potentially dangerous file types
    const dangerousExtensions = [".exe", ".bat", ".cmd", ".sh", ".php", ".js", ".jar"];
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (dangerousExtensions.includes(ext)) {
      throw new ApiError(400, "File type not allowed for security reasons");
    }

    return true;
  }

  /**
   * Upload a file
   * 
   * @param {Object} file - Multer file object (req.file)
   * @param {Object} options - Upload options
   * @param {string} options.mediaType - Type of media (VERIFICATION_DOCUMENT, PROFILE_IMAGE, etc.)
   * @param {string} options.uploadedBy - User ID who uploaded the file
   * @param {string} options.relatedEntityType - Type of related entity (VerificationDocument, LawyerProfile, etc.)
   * @param {string} options.relatedEntityId - ID of related entity
   * @param {Object} options.metadata - Additional metadata
   * @param {boolean} options.isPublic - Whether file should be publicly accessible
   * @param {string} options.folder - Optional folder/path prefix
   * @param {Object} options.validation - File validation options (maxSize, allowedMimeTypes, etc.)
   * @returns {Promise<Object>} Media document
   */
  async upload(file, options = {}) {
    const {
      mediaType,
      uploadedBy,
      relatedEntityType = "Other",
      relatedEntityId = null,
      metadata = {},
      isPublic = true,
      folder = "",
      validation = {}
    } = options;

    // Validate required options
    if (!mediaType) {
      throw new ApiError(400, "mediaType is required");
    }
    if (!uploadedBy) {
      throw new ApiError(400, "uploadedBy is required");
    }

    // Validate file
    this.validateFile(file, validation);

    // Upload to storage
    const uploadResult = await this.storage.upload(
      file.buffer,
      file.originalname || "file",
      {
        folder,
        contentType: file.mimetype,
        isPublic
      }
    );

    // Extract file extension
    const fileExtension = path.extname(file.originalname || "").toLowerCase();

    // Create media record
    const media = await Media.create({
      fileName: uploadResult.storageKey.split("/").pop(), // Just the filename
      originalFileName: file.originalname || "file",
      storageKey: uploadResult.storageKey,
      storageProvider: this.storage.constructor.name === "LocalStorageProvider" ? "local" : "s3",
      mimeType: file.mimetype,
      fileSize: file.size,
      fileExtension,
      url: uploadResult.url,
      isPublic,
      mediaType,
      uploadedBy,
      relatedEntityType,
      relatedEntityId,
      metadata
    });

    return media.toObject();
  }

  /**
   * Replace an existing file
   * 
   * Safely replaces a file by:
   * 1. Uploading new file
   * 2. Updating media record
   * 3. Deleting old file from storage
   * 
   * @param {string} mediaId - ID of media to replace
   * @param {Object} file - New file (Multer file object)
   * @param {Object} options - Options (validation, metadata updates, etc.)
   * @returns {Promise<Object>} Updated media document
   */
  async replace(mediaId, file, options = {}) {
    // Get existing media
    const existingMedia = await Media.findById(mediaId);
    if (!existingMedia) {
      throw new ApiError(404, "Media not found");
    }

    if (!existingMedia.isActive || existingMedia.deletedAt) {
      throw new ApiError(400, "Cannot replace deleted media");
    }

    // Validate new file
    this.validateFile(file, options.validation || {});

    // Upload new file
    const uploadResult = await this.storage.upload(
      file.buffer,
      file.originalname || "file",
      {
        folder: path.dirname(existingMedia.storageKey) || "",
        contentType: file.mimetype,
        isPublic: existingMedia.isPublic
      }
    );

    // Extract file extension
    const fileExtension = path.extname(file.originalname || "").toLowerCase();

    // Store old storage key for deletion
    const oldStorageKey = existingMedia.storageKey;

    // Update media record atomically
    existingMedia.fileName = uploadResult.storageKey.split("/").pop();
    existingMedia.originalFileName = file.originalname || "file";
    existingMedia.storageKey = uploadResult.storageKey;
    existingMedia.mimeType = file.mimetype;
    existingMedia.fileSize = file.size;
    existingMedia.fileExtension = fileExtension;
    existingMedia.url = uploadResult.url;

    // Update metadata if provided
    if (options.metadata) {
      Object.assign(existingMedia.metadata, options.metadata);
    }

    // Update relatedEntityId if provided
    if (options.relatedEntityId !== undefined) {
      existingMedia.relatedEntityId = options.relatedEntityId;
    }

    await existingMedia.save();

    // Delete old file (non-blocking, but log errors)
    try {
      await this.storage.delete(oldStorageKey);
    } catch (error) {
      // Log error but don't fail the operation
      console.error(`Failed to delete old file ${oldStorageKey}:`, error);
    }

    return existingMedia.toObject();
  }

  /**
   * Delete media
   * 
   * Safely deletes media by:
   * 1. Soft delete in database (mark as deleted)
   * 2. Delete from storage
   * 3. Optionally hard delete from database
   * 
   * @param {string} mediaId - ID of media to delete
   * @param {Object} options - Options
   * @param {boolean} options.hardDelete - If true, remove from database entirely
   * @param {boolean} options.force - If true, delete even if still referenced
   * @returns {Promise<boolean>}
   */
  async delete(mediaId, options = {}) {
    const { hardDelete = false, force = false } = options;

    const media = await Media.findById(mediaId);
    if (!media) {
      throw new ApiError(404, "Media not found");
    }

    // Check if media is still in use (unless forced)
    if (!force) {
      // This is a simple check - can be enhanced based on requirements
      // For now, we'll allow deletion but mark it as deleted
    }

    // Delete from storage
    try {
      await this.storage.delete(media.storageKey);
    } catch (error) {
      // Log but continue with database deletion
      console.error(`Failed to delete file from storage ${media.storageKey}:`, error);
    }

    // Delete from database
    if (hardDelete) {
      await Media.findByIdAndDelete(mediaId);
    } else {
      // Soft delete
      media.isActive = false;
      media.deletedAt = new Date();
      await media.save();
    }

    return true;
  }

  /**
   * Bulk delete media
   * 
   * @param {string[]} mediaIds - Array of media IDs
   * @param {Object} options - Options
   * @returns {Promise<Object>} Results
   */
  async bulkDelete(mediaIds, options = {}) {
    const results = {
      deleted: [],
      failed: []
    };

    for (const mediaId of mediaIds) {
      try {
        await this.delete(mediaId, options);
        results.deleted.push(mediaId);
      } catch (error) {
        results.failed.push({ mediaId, error: error.message });
      }
    }

    return results;
  }

  /**
   * Update media metadata
   * 
   * @param {string} mediaId - ID of media
   * @param {Object} updates - Metadata updates
   * @returns {Promise<Object>} Updated media document
   */
  async updateMetadata(mediaId, updates) {
    const media = await Media.findById(mediaId);
    if (!media) {
      throw new ApiError(404, "Media not found");
    }

    // Update metadata map
    if (updates.metadata) {
      Object.assign(media.metadata, updates.metadata);
    }

    // Update other fields if provided
    const allowedFields = ["isPublic", "relatedEntityType", "relatedEntityId"];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        media[field] = updates[field];
      }
    }

    await media.save();
    return media.toObject();
  }

  /**
   * Get media by ID
   * 
   * @param {string} mediaId - ID of media
   * @param {Object} options - Options
   * @param {boolean} options.includeDeleted - Include deleted media
   * @returns {Promise<Object>} Media document
   */
  async getById(mediaId, options = {}) {
    const { includeDeleted = false } = options;

    const query = Media.findById(mediaId);
    if (!includeDeleted) {
      query.where({ isActive: true, deletedAt: null });
    }

    const media = await query.populate("uploadedBy", "email").lean();
    if (!media) {
      throw new ApiError(404, "Media not found");
    }

    return media;
  }

  /**
   * Get media by related entity
   * 
   * @param {string} relatedEntityType - Type of entity
   * @param {string} relatedEntityId - ID of entity
   * @param {Object} options - Options
   * @returns {Promise<Object[]>} Array of media documents
   */
  async getByRelatedEntity(relatedEntityType, relatedEntityId, options = {}) {
    const { mediaType = null, includeDeleted = false } = options;

    const query = Media.find({
      relatedEntityType,
      relatedEntityId,
      ...(mediaType && { mediaType }),
      ...(includeDeleted ? {} : { isActive: true, deletedAt: null })
    });

    return await query.populate("uploadedBy", "email").sort({ createdAt: -1 }).lean();
  }

  /**
   * Get media by uploader
   * 
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object[]>} Array of media documents
   */
  async getByUploader(userId, options = {}) {
    const { mediaType = null, includeDeleted = false } = options;

    const query = Media.find({
      uploadedBy: userId,
      ...(mediaType && { mediaType }),
      ...(includeDeleted ? {} : { isActive: true, deletedAt: null })
    });

    return await query.populate("uploadedBy", "email").sort({ createdAt: -1 }).lean();
  }

  /**
   * Get file URL (with optional signing for private files)
   * 
   * @param {string} mediaId - ID of media
   * @param {Object} options - Options (signed, expiresIn, etc.)
   * @returns {Promise<string>} File URL
   */
  async getUrl(mediaId, options = {}) {
    const media = await Media.findById(mediaId);
    if (!media) {
      throw new ApiError(404, "Media not found");
    }

    // If public and URL already exists, return it
    if (media.isPublic && !options.signed) {
      return media.url;
    }

    // Otherwise, get URL from storage provider (may be signed)
    return await this.storage.getUrl(media.storageKey, options);
  }
}

// Export singleton instance
export const mediaService = new MediaService();

// Export class for testing
export { MediaService };

