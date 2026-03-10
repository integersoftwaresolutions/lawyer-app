/**
 * Storage Provider Factory
 * 
 * Central point for storage provider selection.
 * Switch between local and S3 by changing the provider here.
 */

import { LocalStorageProvider } from "./providers/LocalStorageProvider.js";
// import { S3StorageProvider } from "./providers/S3StorageProvider.js";

/**
 * Get the active storage provider
 * 
 * To switch to S3:
 * 1. Uncomment S3StorageProvider import
 * 2. Change return statement to: return new S3StorageProvider();
 * 3. Ensure AWS credentials are configured
 */
export function getStorageProvider() {
  // ACTIVE: Local storage for development
  return new LocalStorageProvider();
  
  // FUTURE: S3 for production (uncomment when ready)
  // return new S3StorageProvider();
}



