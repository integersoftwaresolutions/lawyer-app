import { AI_MODES } from "../../../config/constants.js";
import { createBaseStrategy } from "./base.strategy.js";
import * as retrievalService from "../retrieval.service.js";

const PAKISTANI_LEGAL_SYSTEM_PROMPT = `You are an AI legal research assistant for practising lawyers in Pakistan.

Jurisdiction and sources: Pakistani law including the Pakistan Penal Code (PPC), Code of Criminal Procedure (CrPC), Contract Act, family law, and constitutional provisions.

Tone: professional, precise, and practical for courtroom and advisory work.

When a <context> section is present below, treat it as authoritative excerpts retrieved from a vetted Pakistani case-law / document corpus.

Citation rules (MUST follow when context is present):
- Cite a context block by its bracket number, e.g. [1] or [2], placed inline immediately after any claim drawn from it.
- Never invent citations. If no context block supports a claim, do not cite anything for it.
- If the context does not contain authority for a question, say so explicitly and answer from general knowledge with a clear caveat.

General rules:
- Do not present yourself as a licensed lawyer or provide definitive legal advice.
- If uncertain, state limitations clearly.
- When asked for case law, prefer the retrieved context over general knowledge.

Disclaimer: AI-generated output is for research assistance only and must be verified by a qualified lawyer.`;

const base = createBaseStrategy({
  mode: AI_MODES.RESEARCH,
  systemPrompt: PAKISTANI_LEGAL_SYSTEM_PROMPT
});

export const researchStrategy = {
  ...base,

  async buildContext(session, userMessage, options = {}) {
    const filters = options?.filters || session?.metadata?.filters || {};
    const result = await retrievalService.retrieveContext({
      query: userMessage,
      lawyerId: session.lawyerId,
      workspaceId: session.workspaceId,
      filters,
      includeLawyerDocuments: options?.includeLawyerDocuments !== false
    });

    return {
      blocks: result.blocks,
      citations: result.citations,
      matchCount: result.matchCount,
      topScore: result.topScore,
      rawMatchCount: result.rawMatchCount,
      semanticMatchCount: result.semanticMatchCount,
      lexicalMatchCount: result.lexicalMatchCount,
      filters
    };
  },

  async postProcess(result, context) {
    const citations = (context?.citations || []).filter((c) => isCitationReferenced(result.content, c));
    return {
      content: result.content,
      citations,
      metadata: {
        retrieval: {
          matchCount: context?.matchCount || 0,
          topScore: context?.topScore || 0,
          rawMatchCount: context?.rawMatchCount || 0,
          semanticMatchCount: context?.semanticMatchCount || 0,
          lexicalMatchCount: context?.lexicalMatchCount || 0,
          usedCitations: citations.length,
          filters: context?.filters || {}
        }
      }
    };
  }
};

/**
 * Keep a citation only if the model actually referenced it. We look for the
 * literal "[N]" marker — the system prompt instructs the model to use this
 * format, and we never want the UI to render unsupported citations.
 */
function isCitationReferenced(content, citation) {
  if (!content || !citation) return false;
  const marker = `[${citation.index}]`;
  return content.includes(marker);
}
