# Storage Provider System

## Overview

Storage providers abstract file storage operations, allowing the application to switch between local filesystem and cloud storage (S3) without changing business logic.

## Current Status

- **ACTIVE**: `LocalStorageProvider` - Stores files in local filesystem
- **READY**: `S3StorageProvider` - AWS S3 implementation (commented, ready to activate)

## Architecture

```
BaseStorageProvider (abstract interface)
├── LocalStorageProvider (active)
└── S3StorageProvider (ready, commented)
```

## Switching to S3

1. Install dependencies:
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

2. Set environment variables:
   ```env
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-bucket
   ```

3. Update `services/storage/index.js`:
   ```javascript
   import { S3StorageProvider } from "./providers/S3StorageProvider.js";
   
   export function getStorageProvider() {
     return new S3StorageProvider();
   }
   ```

4. Uncomment implementation in `S3StorageProvider.js`

No other code changes required!

## Provider Interface

All providers must implement:

- `upload(fileBuffer, fileName, options)` - Upload file
- `delete(storageKey)` - Delete file
- `getUrl(storageKey, options)` - Get file URL
- `exists(storageKey)` - Check if file exists
- `getMetadata(storageKey)` - Get file metadata



