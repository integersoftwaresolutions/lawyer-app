/**
 * Base Storage Provider Interface
 * 
 * All storage providers must implement these methods.
 * This ensures storage-agnostic code throughout the application.
 */

export class BaseStorageProvider {
  /**
   * Upload a file to storage
   * @param {Buffer|Stream} fileBuffer - File content
   * @param {string} fileName - Original file name
   * @param {Object} options - Additional options (folder, metadata, etc.)
   * @returns {Promise<{storageKey: string, url: string}>}
   */
  async upload(fileBuffer, fileName, options = {}) {
    throw new Error("upload() must be implemented by storage provider");
  }

  /**
   * Delete a file from storage
   * @param {string} storageKey - The storage key/path of the file
   * @returns {Promise<boolean>}
   */
  async delete(storageKey) {
    throw new Error("delete() must be implemented by storage provider");
  }

  /**
   * Get a file URL (public or signed)
   * @param {string} storageKey - The storage key/path of the file
   * @param {Object} options - Options (signed, expiresIn, etc.)
   * @returns {Promise<string>}
   */
  async getUrl(storageKey, options = {}) {
    throw new Error("getUrl() must be implemented by storage provider");
  }

  /**
   * Check if a file exists
   * @param {string} storageKey - The storage key/path of the file
   * @returns {Promise<boolean>}
   */
  async exists(storageKey) {
    throw new Error("exists() must be implemented by storage provider");
  }

  /**
   * Get file metadata (size, mime type, etc.)
   * @param {string} storageKey - The storage key/path of the file
   * @returns {Promise<Object>}
   */
  async getMetadata(storageKey) {
    throw new Error("getMetadata() must be implemented by storage provider");
  }
}



