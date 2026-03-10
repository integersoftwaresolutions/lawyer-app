// import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { BaseStorageProvider } from "./BaseStorageProvider.js";
// import { ApiError } from "../../../helpers/apiError.js";

/**
 * AWS S3 Storage Provider
 * 
 * FUTURE implementation for production use.
 * 
 * To activate:
 * 1. Install AWS SDK: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 * 2. Set environment variables:
 *    - AWS_ACCESS_KEY_ID
 *    - AWS_SECRET_ACCESS_KEY
 *    - AWS_REGION
 *    - AWS_S3_BUCKET_NAME
 * 3. Uncomment this file and update MediaService to use S3StorageProvider
 * 
 * This provider is designed but not active to avoid unnecessary dependencies.
 */

/*
export class S3StorageProvider extends BaseStorageProvider {
  constructor() {
    super();
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    this.baseUrl = process.env.AWS_S3_BASE_URL || `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com`;
  }

  generateStorageKey(fileName, folder = "") {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const safeFileName = (fileName || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = path.extname(safeFileName);
    const nameWithoutExt = path.basename(safeFileName, ext);
    
    const key = `${timestamp}_${random}_${nameWithoutExt}${ext}`;
    return folder ? `${folder}/${key}` : key;
  }

  async upload(fileBuffer, fileName, options = {}) {
    const folder = options.folder || "";
    const storageKey = this.generateStorageKey(fileName, folder);
    const contentType = options.contentType || "application/octet-stream";
    const isPublic = options.isPublic !== false; // Default to public

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: isPublic ? "public-read" : "private"
    });

    await this.s3Client.send(command);

    const url = isPublic 
      ? `${this.baseUrl}/${storageKey}`
      : await this.getUrl(storageKey, { signed: true });

    return {
      storageKey,
      url
    };
  }

  async delete(storageKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      throw new ApiError(500, `Failed to delete file from S3: ${error.message}`);
    }
  }

  async getUrl(storageKey, options = {}) {
    if (options.signed) {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey
      });
      const expiresIn = options.expiresIn || 3600; // 1 hour default
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    }
    return `${this.baseUrl}/${storageKey}`;
  }

  async exists(storageKey) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw new ApiError(500, `Failed to check file existence: ${error.message}`);
    }
  }

  async getMetadata(storageKey) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey
      });
      const response = await this.s3Client.send(command);
      
      return {
        size: response.ContentLength,
        contentType: response.ContentType,
        createdAt: response.LastModified,
        modifiedAt: response.LastModified,
        etag: response.ETag
      };
    } catch (error) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        throw new ApiError(404, "File not found");
      }
      throw new ApiError(500, `Failed to get file metadata: ${error.message}`);
    }
  }
}
*/

// Placeholder export for future use
export class S3StorageProvider {
  constructor() {
    throw new Error("S3StorageProvider is not yet implemented. Install AWS SDK and uncomment the implementation.");
  }
}



