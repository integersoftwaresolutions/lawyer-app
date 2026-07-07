import { AI_MODES, CROSS_EXAM_TONES, CROSS_EXAM_TYPES } from "../../../config/constants.js";
import { createBaseStrategy } from "./base.strategy.js";

const SYSTEM_PROMPT = ({ tone, examType, briefSummary }) => `You are role-playing as opposing counsel preparing to cross-examine a witness in a Pakistani ${examType} matter. Your client is the OPPOSING party to the lawyer you are speaking with — your job is to find weaknesses in their case theory, witness statements, and supporting evidence.

Setting: Pakistani courtroom procedure (PPC, CrPC, Qanun-e-Shahadat Order 1984, Constitution of 1973, applicable special laws).

Tone you MUST adopt: ${tone}.
- "aggressive": pointed, leading questions; rapid follow-ups; expose contradictions sharply but never abusive.
- "measured": calm, methodical; build a record through carefully framed questions; courteous but precise.

Procedure for every turn:
1. Ask ONE focused cross-examination question at a time. Use leading questions where strategy permits ("Isn't it true that ...?", "You agree that ...?", "Did you not state previously that ...?").
2. After the lawyer answers, briefly evaluate the answer in <evaluation> tags using these criteria:
   - LOGICAL COHERENCE: Did the answer respect the recorded facts and prior statements?
   - FACTUAL CONSISTENCY: Any contradiction with the case brief, witness list, or earlier turns?
   - PERSUASIVENESS: Would this answer convince a Pakistani judge / withstand objection?
   Score each criterion out of 5.
3. Then ask the next question, naturally building on any weakness exposed.
4. Stay in character. Do NOT break role to give legal advice or summarise — until the lawyer types "/end" or "/report" you remain opposing counsel.

Hard rules:
- Never threaten, demean, or use slurs.
- Never invent facts not present in the case brief or in the lawyer's prior responses.
- If the lawyer asks for procedural help, briefly answer in <oc-aside> tags then resume cross-examination.
- If the lawyer types "/end" or "/report", stop immediately and reply with the literal token "[END_OF_CROSS_EXAM]" — your supervisor will then generate the preparation report.

Case brief (one-time briefing, do not repeat back):
${briefSummary}

Begin with a strong opening cross-examination question targeting the most vulnerable factual claim in the lawyer's brief.`;

const base = createBaseStrategy({
  mode: AI_MODES.CROSS_EXAM,
  systemPrompt: ""
});

function getCaseBrief(session) {
  return session?.metadata?.caseBrief || {};
}

function buildBriefSummary(brief) {
  if (!brief || Object.keys(brief).length === 0) {
    return "(no case brief provided — ask the lawyer to outline facts before cross-examining.)";
  }
  const parts = [];
  if (brief.facts) parts.push(`Facts:\n${brief.facts}`);
  if (brief.theory) parts.push(`Case theory:\n${brief.theory}`);
  if (brief.arguments) parts.push(`Key arguments:\n${brief.arguments}`);
  if (Array.isArray(brief.witnesses) && brief.witnesses.length) {
    parts.push("Witness list:");
    brief.witnesses.forEach((w, i) => {
      parts.push(`  ${i + 1}. ${w.name || "Witness"} — ${w.role || ""} ${w.statement ? `\n     Statement: ${w.statement}` : ""}`.trim());
    });
  }
  if (brief.exhibits) parts.push(`Exhibits / evidence:\n${brief.exhibits}`);
  if (brief.weaknesses) parts.push(`Acknowledged weaknesses:\n${brief.weaknesses}`);
  return parts.join("\n\n");
}

function resolveTone(session, options) {
  const fromOptions = options?.tone;
  const fromMeta = session?.metadata?.tone;
  const v = fromOptions || fromMeta || CROSS_EXAM_TONES.MEASURED;
  return Object.values(CROSS_EXAM_TONES).includes(v) ? v : CROSS_EXAM_TONES.MEASURED;
}

function resolveType(session, options) {
  const fromOptions = options?.examType;
  const fromMeta = session?.metadata?.examType;
  const v = fromOptions || fromMeta || CROSS_EXAM_TYPES.CIVIL;
  return Object.values(CROSS_EXAM_TYPES).includes(v) ? v : CROSS_EXAM_TYPES.CIVIL;
}

export const crossExamStrategy = {
  ...base,

  getSystemPrompt(session, options) {
    return SYSTEM_PROMPT({
      tone: resolveTone(session, options),
      examType: resolveType(session, options),
      briefSummary: buildBriefSummary(getCaseBrief(session))
    });
  },

  async buildContext(session, _userMessage, options = {}) {
    return {
      blocks: [],
      citations: [],
      tone: resolveTone(session, options),
      examType: resolveType(session, options)
    };
  },

  async buildMessages(session, historyMessages, context) {
    const systemPrompt = this.getSystemPrompt(session, context);
    const messages = [{ role: "system", content: systemPrompt }];

    for (const msg of historyMessages) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    return messages;
  },

  async postProcess(result, context) {
    const ended = /\[END_OF_CROSS_EXAM\]/i.test(result.content);
    return {
      content: result.content,
      citations: [],
      metadata: {
        crossExam: {
          tone: context?.tone,
          examType: context?.examType,
          ended
        }
      }
    };
  }
};
