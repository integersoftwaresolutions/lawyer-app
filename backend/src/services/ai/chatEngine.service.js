import * as openaiClient from "./openai.client.js";

export async function complete(messages, options = {}) {
  return openaiClient.chatComplete(messages, options);
}
