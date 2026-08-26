import Groq from "groq-sdk";

const GROQ_DEFAULT_MODEL = "openai/gpt-oss-120b";
const GROQ_FAST_MODEL = "openai/gpt-oss-20b";

// Maps Gemini model name env vars to Groq model names
const resolveGroqModel = (modelName: string): string => {
  const cleaned = modelName.replace(/^models\//, "");
  const map: Record<string, string> = {
    "gemini-2.0-flash": GROQ_DEFAULT_MODEL,
    "gemini-1.5-flash": GROQ_DEFAULT_MODEL,
    "gemini-1.5-pro": GROQ_DEFAULT_MODEL,
    "gemini-2.0-flash-lite": GROQ_FAST_MODEL,
  };
  return map[cleaned] ?? map[modelName] ?? cleaned;
};

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  // Disable built-in retries — we handle retries ourselves via model rotation.
  // groq-sdk's retry logic can produce a negative setTimeout value when the
  // Retry-After header contains a past date, triggering a Node.js warning.
  return new Groq({ apiKey, maxRetries: 0 });
};

type GenerateContentResult = {
  response: {
    text: () => string;
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
};

type ChatMessage = {
  role: string;
  parts: Array<{ text: string }>;
};

type StartChatParams = {
  systemInstruction?: { role?: string; parts: Array<{ text: string }> };
  history?: ChatMessage[];
};

type GenerateContentInput =
  | string
  | {
      systemInstruction?: string | { role?: string; parts: Array<{ text: string }> };
      contents: Array<{ role: string; parts: Array<{ text: string }> }>;
      generationConfig?: { temperature?: number; maxOutputTokens?: number };
    };

const makeResult = (text: string): GenerateContentResult => ({
  response: {
    text: () => text,
    candidates: [{ content: { parts: [{ text }] } }],
  },
});

export const getGeminiModel = (modelName = "gemini-2.0-flash") => {
  const groqModel = resolveGroqModel(modelName);
  const client = getGroqClient();

  return {
    generateContent: async (
      prompt: GenerateContentInput
    ): Promise<GenerateContentResult> => {
      let messages: Groq.Chat.ChatCompletionMessageParam[];
      let temperature: number | undefined;

      if (typeof prompt === "string") {
        messages = [{ role: "user", content: prompt }];
      } else {
        const systemText =
          typeof prompt.systemInstruction === "string"
            ? prompt.systemInstruction
            : prompt.systemInstruction?.parts?.map((p) => p.text).join("") ?? "";
        const contentMessages: Groq.Chat.ChatCompletionMessageParam[] =
          prompt.contents.map((c) => ({
            role: (c.role === "model" ? "assistant" : c.role) as
              | "user"
              | "assistant"
              | "system",
            content: c.parts.map((p) => p.text).join(""),
          }));
        messages = [
          ...(systemText
            ? [{ role: "system" as const, content: systemText }]
            : []),
          ...contentMessages,
        ];
        temperature = prompt.generationConfig?.temperature;
      }

      const completion = await client.chat.completions.create({
        model: groqModel,
        messages,
        ...(temperature !== undefined ? { temperature } : {}),
      });

      return makeResult(completion.choices[0]?.message?.content ?? "");
    },

    startChat: (params: StartChatParams = {}) => {
      const systemText =
        params.systemInstruction?.parts.map((p) => p.text).join("") ?? "";
      const historyMessages: Groq.Chat.ChatCompletionMessageParam[] = (
        params.history ?? []
      ).map((msg) => ({
        role: (msg.role === "model" ? "assistant" : msg.role) as
          | "user"
          | "assistant",
        content: msg.parts.map((p) => p.text).join(""),
      }));

      return {
        sendMessage: async (
          userMessage: string
        ): Promise<GenerateContentResult> => {
          const messages: Groq.Chat.ChatCompletionMessageParam[] = [
            ...(systemText
              ? [{ role: "system" as const, content: systemText }]
              : []),
            ...historyMessages,
            { role: "user" as const, content: userMessage },
          ];

          const completion = await client.chat.completions.create({
            model: groqModel,
            messages,
          });

          return makeResult(completion.choices[0]?.message?.content ?? "");
        },
      };
    },
  };
};

// Groq does not support embeddings — RAG engine should be disabled
export const getEmbedding = async (_text: string): Promise<number[]> => {
  throw new Error(
    "Embeddings are not supported with Groq. Set RAG_ENGINE_ENABLED=false to disable the RAG engine."
  );
};
