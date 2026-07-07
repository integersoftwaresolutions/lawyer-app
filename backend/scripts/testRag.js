/**
 * Standalone end-to-end RAG smoke test.
 *
 * Run with:
 *   node scripts/testRag.js
 *
 * What it does:
 *   1. Connects to MongoDB.
 *   2. Verifies OpenAI + Pinecone env vars are present.
 *   3. Ingests one sample Pakistani case-law judgment (chunk → embed → upsert).
 *   4. Runs a semantic query against the case-law namespace.
 *   5. Prints the retrieved blocks + citations.
 *   6. Cleans up (deletes the test row + its vectors) and exits.
 *
 * Safe to re-run: it deletes its sample row before recreating it.
 */

import { connectMongo } from "../src/db/mongo.js";
import mongoose from "mongoose";
import { isOpenAiConfigured } from "../src/services/ai/openai.client.js";
import { isPineconeConfigured, ragConfig } from "../src/config/rag.config.js";
import * as ingestService from "../src/services/ai/ingest/ingest.service.js";
import * as retrievalService from "../src/services/ai/retrieval.service.js";
import * as embeddingService from "../src/services/ai/embedding.service.js";
import * as vectorStore from "../src/services/ai/vectorStore/index.js";
import CaseLaw from "../src/models/CaseLaw.js";

const SAMPLE = {
  title: "Mst. Sample Petitioner v. The State (RAG smoke test)",
  court: "Supreme Court of Pakistan",
  year: 2023,
  caseReference: "PLD 2023 SC TEST-001",
  citation: "PLD 2023 SC TEST-001",
  subject: "Constitutional Law",
  sourceUrl: "https://example.test/judgments/test-001",
  sourceProvider: "rag-smoke-test",
  text: `
This petition was filed under Article 184(3) of the Constitution of the
Islamic Republic of Pakistan, 1973. The petitioner contended that her
right to a fair trial under Article 10A of the Constitution had been
violated when the trial court refused to allow cross-examination of the
prosecution's principal witness.

The Court, in considering the scope of Article 10A, held that the right
to a fair trial is a fundamental right which cannot be curtailed by
procedural directions of a subordinate court. The right of cross-examination
is an integral part of due process under Article 10A and Section 540 of the
Code of Criminal Procedure, 1898 (CrPC).

The Court further observed that the principle of audi alteram partem —
that no person shall be condemned unheard — is a settled doctrine of
Pakistani jurisprudence and has been consistently applied by superior
courts. Reliance was placed on earlier decisions of this Court interpreting
Article 4 and Article 25 of the Constitution.

Accordingly, the impugned order of the trial court was set aside and the
matter was remanded for fresh proceedings with directions to permit
cross-examination of the prosecution's principal witness in accordance
with the law. The petition was disposed of in these terms.
`.trim()
};

async function main() {
  console.log("→ RAG smoke test starting\n");

  if (!isOpenAiConfigured()) {
    fail("OPENAI_API_KEY is not set in backend/.env");
  }
  if (!isPineconeConfigured()) {
    fail("PINECONE_API_KEY or PINECONE_INDEX is not set in backend/.env");
  }
  console.log(`  • Pinecone index : ${ragConfig.pinecone.indexName}`);
  console.log(`  • Case-law ns    : ${ragConfig.pinecone.caseLawNamespace}`);
  console.log(`  • Embedding dims : ${ragConfig.embeddingDimensions}`);
  console.log("");

  console.log("→ Connecting to MongoDB...");
  await connectMongo();
  console.log("  ✓ connected\n");

  // Clean up any prior smoke-test row so we always start fresh.
  const prior = await CaseLaw.findOne({ caseReference: SAMPLE.caseReference });
  if (prior) {
    console.log("→ Removing prior smoke-test row...");
    await ingestService.deleteCaseLaw(prior._id);
    console.log("  ✓ cleaned up\n");
  }

  console.log("→ Ingesting sample judgment (chunk → embed → upsert to Pinecone)...");
  const t0 = Date.now();
  const ingestResult = await ingestService.ingestCaseLaw(SAMPLE);
  console.log(`  ✓ ingested in ${Date.now() - t0}ms`);
  console.log(`     chunks indexed : ${ingestResult.chunkCount}`);
  console.log(`     embedding model: ${ingestResult.embeddingModel}`);
  console.log(`     namespace      : ${ingestResult.namespace}\n`);

  // Pinecone Serverless is eventually consistent on the read path. On the
  // Starter tier 5–15s is typical right after an upsert; we poll up to 30s.
  console.log("→ Waiting for Pinecone to make new vectors queryable...");
  const waitedSecs = await waitForVectorsVisible(SAMPLE.text);
  console.log(`  ✓ vectors visible after ~${waitedSecs}s\n`);

  const queries = [
    "What does Article 10A of the Constitution of Pakistan guarantee?",
    "Is cross-examination part of due process under Pakistani law?",
    "Tell me about the audi alteram partem principle in Pakistani jurisprudence."
  ];

  for (const query of queries) {
    console.log(`→ Query: "${query}"`);

    // Raw vector query (no threshold filter) — shows true cosine scores.
    const { embedding } = await embeddingService.embedQuery(query);
    const rawMatches = await vectorStore.query(
      ragConfig.pinecone.caseLawNamespace,
      embedding,
      { topK: 5 }
    );
    console.log(`     raw matches: ${rawMatches.length}`);
    rawMatches.forEach((m, i) => {
      console.log(`       #${i + 1} score=${m.score.toFixed(3)} id=${m.id}`);
    });

    // High-level retrieval (applies the configured score threshold).
    const result = await retrievalService.retrieveContext({
      query,
      lawyerId: null,
      includeLawyerDocuments: false
    });
    console.log(`     above threshold (${ragConfig.minScore}): ${result.matchCount}`);
    for (const c of result.citations) {
      const heading = [c.court, c.year, c.caseReference].filter(Boolean).join(" · ");
      console.log(`     [${c.index}] ${heading} (score=${c.score.toFixed(3)})`);
    }
    console.log("");
  }

  console.log("→ Cleaning up sample row + vectors...");
  await ingestService.deleteCaseLaw(ingestResult.caseLawId);
  console.log("  ✓ cleaned up\n");

  console.log("✅ RAG smoke test passed.");
  await mongoose.disconnect();
  process.exit(0);
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Polls Pinecone with the same text we just upserted (cosine ~1.0 expected
 * once the vector is visible). Returns the elapsed seconds when the first
 * match comes back, or throws after 30s.
 */
async function waitForVectorsVisible(probeText, maxSeconds = 30) {
  const { embedding } = await embeddingService.embedQuery(probeText.slice(0, 500));
  const start = Date.now();
  while ((Date.now() - start) / 1000 < maxSeconds) {
    const matches = await vectorStore.query(
      ragConfig.pinecone.caseLawNamespace,
      embedding,
      { topK: 1 }
    );
    if (matches.length > 0) {
      return Math.round((Date.now() - start) / 1000);
    }
    await sleep(1500);
  }
  throw new Error(`Pinecone did not return any matches within ${maxSeconds}s`);
}

main().catch(async (err) => {
  console.error("\n✗ Smoke test failed:", err?.message || err);
  if (err?.stack) console.error(err.stack);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
