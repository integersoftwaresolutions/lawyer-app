/**
 * Token-aware text chunker.
 *
 * We use a fast heuristic (~4 chars per token) instead of pulling in a full
 * tokenizer such as `tiktoken`. This keeps the dependency footprint small and
 * is accurate enough for chunk-size control around the OpenAI embedding limit.
 *
 * The splitter prefers paragraph and sentence boundaries before falling back
 * to word boundaries — this preserves legal sentence integrity in case-law
 * which the LLM/embedder benefits from.
 */

import { ragConfig } from "../../config/rag.config.js";

const CHARS_PER_TOKEN = 4;

export function approxTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function tokensToChars(tokens) {
  return Math.max(1, tokens) * CHARS_PER_TOKEN;
}

/**
 * Normalises whitespace, collapses repeated blank lines, trims surrounding
 * whitespace. Keeps paragraph breaks (single blank line).
 */
export function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split text into overlapping chunks targeting ~chunkSizeTokens with
 * ~chunkOverlapTokens of overlap. Returns an array of objects:
 *   { index, text, charStart, charEnd, approxTokens }
 */
export function chunkText(rawText, options = {}) {
  const text = normalizeText(rawText);
  if (!text) return [];

  const chunkSizeTokens = options.chunkSizeTokens ?? ragConfig.chunkSizeTokens;
  const overlapTokens = options.chunkOverlapTokens ?? ragConfig.chunkOverlapTokens;
  const targetChars = tokensToChars(chunkSizeTokens);
  const overlapChars = tokensToChars(overlapTokens);

  if (text.length <= targetChars) {
    return [
      {
        index: 0,
        text,
        charStart: 0,
        charEnd: text.length,
        approxTokens: approxTokens(text)
      }
    ];
  }

  const chunks = [];
  let cursor = 0;
  let index = 0;

  while (cursor < text.length) {
    const tentativeEnd = Math.min(cursor + targetChars, text.length);

    // Try to end on a clean boundary near tentativeEnd. Look back up to 25%
    // of the chunk for a paragraph / sentence / word break.
    const lookbackWindow = Math.floor(targetChars * 0.25);
    const minEnd = Math.max(cursor + 1, tentativeEnd - lookbackWindow);

    let end = tentativeEnd;
    if (tentativeEnd < text.length) {
      const sliceForSearch = text.slice(minEnd, tentativeEnd);
      const paragraphBreak = sliceForSearch.lastIndexOf("\n\n");
      const sentenceBreak = Math.max(
        sliceForSearch.lastIndexOf(". "),
        sliceForSearch.lastIndexOf("? "),
        sliceForSearch.lastIndexOf("! "),
        sliceForSearch.lastIndexOf(".\n"),
        sliceForSearch.lastIndexOf("?\n"),
        sliceForSearch.lastIndexOf("!\n")
      );
      const wordBreak = sliceForSearch.lastIndexOf(" ");

      if (paragraphBreak !== -1) {
        end = minEnd + paragraphBreak + 2;
      } else if (sentenceBreak !== -1) {
        end = minEnd + sentenceBreak + 2;
      } else if (wordBreak !== -1) {
        end = minEnd + wordBreak + 1;
      }
    }

    const chunkBody = text.slice(cursor, end).trim();
    if (chunkBody.length > 0) {
      chunks.push({
        index: index++,
        text: chunkBody,
        charStart: cursor,
        charEnd: end,
        approxTokens: approxTokens(chunkBody)
      });
    }

    if (end >= text.length) break;
    cursor = Math.max(end - overlapChars, cursor + 1);
  }

  return chunks;
}
