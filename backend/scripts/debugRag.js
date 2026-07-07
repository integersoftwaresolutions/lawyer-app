/**
 * Live RAG diagnostic — embed a query, run it against Pinecone, and print the
 * raw cosine scores so we can compare against the configured threshold.
 *
 * Run with:
 *   cd backend
 *   node scripts/debugRag.js "Your question here"
 *
 * Defaults to a Section 497 bail query if no argument is given.
 */

import mongoose from "mongoose";
import { connectMongo } from "../src/db/mongo.js";
import { isOpenAiConfigured } from "../src/services/ai/openai.client.js";
import { isPineconeConfigured, ragConfig } from "../src/config/rag.config.js";
import * as embeddingService from "../src/services/ai/embedding.service.js";
import * as vectorStore from "../src/services/ai/vectorStore/index.js";
import * as retrievalService from "../src/services/ai/retrieval.service.js";

const DEFAULT_QUERY =
  "Find recent Supreme Court cases on bail under section 497 CrPC";

async function main() {
  const query = process.argv.slice(2).join(" ").trim() || DEFAULT_QUERY;

  console.log("→ RAG diagnostic\n");
  console.log(`  Query           : "${query}"`);

  if (!isOpenAiConfigured()) fail("OPENAI_API_KEY is not set");
  if (!isPineconeConfigured()) fail("PINECONE_API_KEY/PINECONE_INDEX is not set");

  console.log(`  Pinecone index  : ${ragConfig.pinecone.indexName}`);
  console.log(`  Case-law ns     : ${ragConfig.pinecone.caseLawNamespace}`);
  console.log(`  topK            : ${ragConfig.topK}`);
  console.log(`  minScore        : ${ragConfig.minScore}`);
  console.log("");

  await connectMongo();

  // Step 1: raw vector query (no threshold filter) — shows true cosine scores.
  console.log("→ Embedding query and probing Pinecone (no threshold)…\n");
  const { embedding, model } = await embeddingService.embedQuery(query);
  const raw = await vectorStore.query(
    ragConfig.pinecone.caseLawNamespace,
    embedding,
    { topK: Math.max(ragConfig.topK, 8) }
  );

  if (raw.length === 0) {
    console.log("  ✗ No matches at all — vectors not visible yet, or namespace empty.");
    console.log("    • If you just seeded, wait 10–30s for Pinecone serverless and retry.");
    console.log("    • Confirm Admin → Case Law shows 'indexed' rows with chunk counts > 0.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`  Embedding model : ${model}`);
  console.log(`  Raw matches     : ${raw.length}`);
  console.log("");
  console.log("  rank  score   threshold  id");
  console.log("  ----  ------  ---------  --------------------------------------------------");
  raw.forEach((m, i) => {
    const passes = m.score >= ragConfig.minScore ? "PASS" : "fail";
    const meta = m.metadata || {};
    const heading = [meta.court, meta.year, meta.caseReference || meta.title]
      .filter(Boolean)
      .join(" · ");
    console.log(
      `  #${String(i + 1).padStart(2)}  ${m.score.toFixed(3)}   ${passes.padStart(4)}      ${m.id}`
    );
    if (heading) {
      console.log(`         └─ ${heading}`);
    }
  });
  console.log("");

  // Step 2: high-level retrieval (applies the configured score threshold).
  console.log("→ Running retrievalService.retrieveContext (production code path)…\n");
  const result = await retrievalService.retrieveContext({
    query,
    lawyerId: null,
    includeLawyerDocuments: false
  });

  console.log(`  matches above threshold : ${result.matchCount}`);
  console.log(`  context blocks injected : ${result.blocks?.length || 0}`);
  console.log(`  citations attached      : ${result.citations.length}`);
  if (result.citations.length > 0) {
    console.log("");
    for (const c of result.citations) {
      const heading = [c.court, c.year, c.caseReference, c.title].filter(Boolean).join(" · ");
      console.log(`  [${c.index}] ${heading}`);
      console.log(`      score=${c.score.toFixed(3)}  source=${c.sourceType}`);
      if (c.excerpt) {
        const oneLine = c.excerpt.replace(/\s+/g, " ").slice(0, 160);
        console.log(`      "${oneLine}…"`);
      }
    }
  }

  // Step 3: human-readable verdict.
  console.log("");
  if (result.matchCount === 0 && raw.length > 0) {
    const top = raw[0].score;
    const suggested = Math.max(0.2, Math.min(0.6, Math.floor(top * 100) / 100 - 0.05));
    console.log("⚠  Pinecone IS returning matches but every one is below your threshold.");
    console.log(`   • Top raw score is ${top.toFixed(3)}, current minScore is ${ragConfig.minScore}.`);
    console.log(`   • Try lowering RAG_MIN_SCORE in backend/.env to around ${suggested.toFixed(2)} and restart the server.`);
  } else if (result.matchCount > 0) {
    console.log("✅ Retrieval is healthy. Citations should appear in the AI Assistant for this query.");
  } else {
    console.log("⚠  No matches at any score — check the namespace, embedding dimensions, and index status.");
  }

  await mongoose.disconnect();
  process.exit(0);
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

main().catch(async (err) => {
  console.error("\n✗ Diagnostic crashed:", err?.message || err);
  if (err?.stack) console.error(err.stack);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
