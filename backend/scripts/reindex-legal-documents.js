import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import LegalDocument from "../src/models/LegalDocument.js";
import { ingestLegalDocument } from "../src/services/ai/ingest/ingest.service.js";

const ownerArg = process.argv.find((arg) => arg.startsWith("--owner="));
const ownerUserId = ownerArg?.split("=")[1] || "";

async function main() {
  await mongoose.connect(env.mongoUri);

  const filter = {
    isDeleted: false,
    rawText: { $type: "string", $ne: "" },
    ...(ownerUserId ? { ownerUserId } : {})
  };

  const documents = await LegalDocument.find(filter).sort({ updatedAt: 1 }).lean();
  console.log(`Re-indexing ${documents.length} private document(s)...`);

  let succeeded = 0;
  let failed = 0;

  for (const document of documents) {
    try {
      const result = await ingestLegalDocument(
        {
          _id: document._id,
          ownerUserId: document.ownerUserId,
          title: document.title,
          description: document.description,
          caseRef: document.caseRef,
          tags: document.tags,
          mediaId: document.mediaId,
          text: document.rawText
        },
        { userId: document.ownerUserId, metadata: { source: "reindex" } }
      );

      succeeded += 1;
      console.log(`✓ ${document.title}: ${result.chunkCount} chunks`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${document.title}: ${error.message}`);
    }
  }

  console.log(`Re-index complete: ${succeeded} succeeded, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Re-index failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
