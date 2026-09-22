import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Same model as content/generate and the concierge (DECISIONS [Sprint 8]).
export const TRIPS_MODEL = "claude-sonnet-5";

/** Logs an Anthropic failure with the same detail content/generate records. */
export function logAnthropicError(tag: string, err: unknown): void {
  if (err instanceof Anthropic.AuthenticationError) {
    console.error(`[${tag}] Anthropic auth error (check ANTHROPIC_API_KEY):`, err.status, err.message);
  } else if (err instanceof Anthropic.RateLimitError) {
    console.error(`[${tag}] Anthropic rate limited:`, err.status, err.message);
  } else if (err instanceof Anthropic.APIError) {
    console.error(`[${tag}] Anthropic API error:`, err.status, err.name, err.message);
  } else {
    console.error(`[${tag}] Anthropic call failed:`, err);
  }
}

export function messageText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}
