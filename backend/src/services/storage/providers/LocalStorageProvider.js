import fs from "fs/promises";
import path from "path";
import { BaseStorageProvider } from "./BaseStorageProvider.js";
import { ApiError } from "../../../helpers/apiError.js";

/**
 * Local File System Storage Provider
 * 
 * ACTIVE implementation for local development and testing.
 * Stores files in the local filesystem under the uploads directory.
 */
export class LocalStorageProvider extends BaseStorageProvider {
  constructor() {
    super();
    this.uploadsDir = path.join(process.cwd(), "uploads");
    this.baseUrl = process.env.BASE_URL || "http://localhost:5000";
    this.ensureUploadsDir();
  }

  async ensureUploadsDir() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Generate a unique storage key (filename) to prevent collisions
   */
  generateStorageKey(fileName, folder = "") {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const safeFileName = (fileName || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = path.extname(safeFileName);
    const nameWithoutExt = path.basename(safeFileName, ext);
    
    const key = `${timestamp}_${random}_${nameWithoutExt}${ext}`;
    return folder ? `${folder}/${key}` : key;
  }

  /**
   * Upload file to local storage
   */
  async upload(fileBuffer, fileName, options = {}) {
    await this.ensureUploadsDir();

    const folder = options.folder || "";
    const storageKey = this.generateStorageKey(fileName, folder);
    const filePath = path.join(this.uploadsDir, storageKey);

    // Ensure folder exists if specified
    if (folder) {
      const folderPath = path.join(this.uploadsDir, folder);
      try {
        await fs.access(folderPath);
      } catch {
        await fs.mkdir(folderPath, { recursive: true });
      }
    }

    // Write file
    await fs.writeFile(filePath, fileBuffer);

    // Return only the path (not full URL) - frontend will construct full URL
    const urlPath = `/uploads/${storageKey}`;

    return {
      storageKey,
      url: urlPath  // Store only path, not full URL
    };
  }

  /**
   * Delete file from local storage
   */
  async delete(storageKey) {
    try {
      const filePath = path.join(this.uploadsDir, storageKey);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      // File doesn't exist or already deleted - not an error
      if (error.code === "ENOENT") {
        return true;
      }
      throw new ApiError(500, `Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file URL (for local storage, return path only - frontend constructs full URL)
   */
  async getUrl(storageKey, options = {}) {
    return `/uploads/${storageKey}`;
  }

  /**
   * Check if file exists
   */
  async exists(storageKey) {
    try {
      const filePath = path.join(this.uploadsDir, storageKey);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(storageKey) {
    try {
      const filePath = path.join(this.uploadsDir, storageKey);
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new ApiError(404, "File not found");
      }
      throw new ApiError(500, `Failed to get file metadata: ${error.message}`);
    }
  }
}

