import Groq from "groq-sdk";
import sql from "@/lib/db";

export const GROQ_MODELS = {
  QWEN_38: "qwen/qwen3.8-27b",
  GPT_OSS_120B: "openai/gpt-oss-120b",
  GPT_OSS_20B: "openai/gpt-oss-20b",
  QWEN_36: "qwen/qwen3.6-27b",
  COMPOUND_MINI: "groq/compound-mini",
} as const;

export type GroqModelId = (typeof GROQ_MODELS)[keyof typeof GROQ_MODELS];

// Ordered by daily token budget on the free tier: qwen3.8 allows 2M TPD,
// the gpt-oss pair and qwen3.6 allow 200K each. compound-mini is last — it has
// the lowest daily request cap (250 RPD) and runs built-in tools we don't want
// firing on deterministic formatting work.
export const DEFAULT_MODEL_POOL: GroqModelId[] = [
  GROQ_MODELS.QWEN_38,
  GROQ_MODELS.GPT_OSS_120B,
  GROQ_MODELS.GPT_OSS_20B,
  GROQ_MODELS.QWEN_36,
  GROQ_MODELS.COMPOUND_MINI,
];

export interface GenerateOptions {
  models?: string[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  feature?: string;
}

function logUsage(model: string, feature: string, usage: Groq.CompletionUsage): void {
  sql`
    INSERT INTO goodhive.groq_usage (model, feature, prompt_tokens, completion_tokens, total_tokens)
    VALUES (${model}, ${feature}, ${usage.prompt_tokens}, ${usage.completion_tokens}, ${usage.total_tokens})
  `.catch((err) => console.error("groq: failed to log usage:", err));
}

let roundRobinIndex = 0;

function getRotatedModels(models: string[]): string[] {
  const start = roundRobinIndex++ % models.length;
  return [...models.slice(start), ...models.slice(0, start)];
}

/**
 * Some models (qwen3.6) emit their chain of thought as <think> blocks inside
 * the message content, which breaks every caller that parses JSON or HTML.
 * An unterminated block means reasoning consumed the whole token budget, so
 * nothing usable follows — returning "" lets the caller rotate to the next model.
 */
function stripReasoning(raw: string): string {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const unterminated = text.search(/<think>/i);
  if (unterminated !== -1) text = text.slice(0, unterminated);
  return text.trim();
}

function isRateLimitError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  const message = (error as { message?: string })?.message ?? "";
  return status === 429 || message.includes("429") || message.toLowerCase().includes("rate limit");
}

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
  // Disable built-in retries — we rotate models ourselves.
  // groq-sdk retries can produce negative setTimeout values when Retry-After contains a past date.
  return new Groq({ apiKey, maxRetries: 0 });
}

/**
 * Generate text with automatic model fallback.
 * Rotates through `models` (default: the full pool) and returns the first
 * successful response. Throws only when every model has failed.
 */
export async function generateWithFallback(
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const { models = DEFAULT_MODEL_POOL, systemPrompt, temperature, maxTokens, feature = "unknown" } = options;

  const client = getGroqClient();
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
    { role: "user" as const, content: prompt },
  ];

  const orderedModels = getRotatedModels(models);
  const errors: string[] = [];

  for (const model of orderedModels) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages,
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
      });

      const text = stripReasoning(completion.choices[0]?.message?.content ?? "");
      if (text) {
        if (completion.usage) logUsage(model, feature, completion.usage);
        return text;
      }

      errors.push(`${model}: empty response`);
    } catch (error) {
      const msg = (error as { message?: string })?.message ?? "unknown error";
      if (isRateLimitError(error)) {
        console.warn(`groq: rate limited on ${model}, rotating to next`);
        errors.push(`${model}: rate limited`);
      } else {
        console.error(`groq: error on ${model}: ${msg}`);
        errors.push(`${model}: ${msg}`);
      }
    }
  }

  throw new Error(`All Groq models failed — ${errors.join(" | ")}`);
}
