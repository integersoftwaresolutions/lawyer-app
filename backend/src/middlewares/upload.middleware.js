import multer from "multer";

/**
 * Upload Middleware
 * 
 * Uses memory storage so MediaService can handle the actual file storage.
 * This keeps storage logic centralized in MediaService.
 */

// Memory storage - files are stored in memory as buffers
// MediaService will handle actual storage (local or S3)
const storage = multer.memoryStorage();

// File size limit: 10MB (can be overridden per route)
export const uploadSingle = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB default
  }
}).single("file");

// For multiple files (if needed in future)
export const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
}).array("files", 10); // Max 10 files
