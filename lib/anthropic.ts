import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// A single shared client. The API key is read from the server environment and
// never reaches the browser (this module is server-only).
let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to the server environment.",
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}
