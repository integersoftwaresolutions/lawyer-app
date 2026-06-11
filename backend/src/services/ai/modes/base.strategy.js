import { aiConfig } from "../../../config/ai.config.js";

export function createBaseStrategy({ mode, systemPrompt, model }) {
  return {
    mode,
    model: model || aiConfig.chatModel,
    getSystemPrompt() {
      return systemPrompt;
    },
    async buildContext(_session, _userMessage, _options = {}) {
      return { blocks: [] };
    },
    async buildMessages(session, historyMessages, context) {
      const systemParts = [this.getSystemPrompt()];

      if (context?.blocks?.length) {
        systemParts.push("\n\n<context>\n" + context.blocks.join("\n\n") + "\n</context>");
      }

      const messages = [{ role: "system", content: systemParts.join("") }];

      for (const msg of historyMessages) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      return messages;
    },
    async postProcess(result, _context) {
      return {
        content: result.content,
        citations: [],
        metadata: {}
      };
    }
  };
}
