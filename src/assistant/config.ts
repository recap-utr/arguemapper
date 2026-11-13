import type { LanguageModelCallOptions } from "ai";

// a type instead of an interface, so that it is assignable to the provenance of the graph
export type AssistantConfig = Readonly<{
  model: string;
  baseURL: string;
  /** Reasoning effort, the `reasoning` call setting of the AI SDK. */
  reasoning: NonNullable<LanguageModelCallOptions["reasoning"]>;
}>;

/** Connection and model settings of the assistant. */
export type AssistantSettings = AssistantConfig &
  Readonly<{
    /** Optional, local servers usually need none. Persisted for the browser session only. */
    apiKey: string;
  }>;

export const defaultAssistantConfig: AssistantConfig = {
  model: "chatgpt-latest",
  baseURL: "https://api.openai.com/v1",
  reasoning: "medium",
};

/** Reasoning efforts offered to the user. */
export const reasoningLevels: readonly AssistantConfig["reasoning"][] = ["low", "medium", "high"];

/** The given settings completed with the defaults, other fields (e.g. of older versions) are dropped. */
export function resolveAssistantConfig({
  model,
  baseURL,
  reasoning,
}: Partial<AssistantConfig> = {}): AssistantConfig {
  return {
    model: model ?? defaultAssistantConfig.model,
    baseURL: baseURL ?? defaultAssistantConfig.baseURL,
    reasoning: reasoning ?? defaultAssistantConfig.reasoning,
  };
}
