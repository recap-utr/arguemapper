import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  isStepCount,
  tool,
  ToolLoopAgent,
  type ToolLoopAgentSettings,
  type ToolSet,
} from "ai";
import { mapValues } from "es-toolkit";
import type { AssistantSettings } from "@/assistant/config.js";
import { INSTRUCTIONS } from "@/assistant/instructions.js";
import type { AssistantTools } from "@/assistant/tools.js";

/** The tools as tools of the AI SDK. */
const toolSet = (tools: AssistantTools): ToolSet =>
  mapValues(tools, (definition) =>
    tool({
      description: definition.description,
      inputSchema: definition.inputSchema,
      execute: (input, { abortSignal }) => definition.execute(input, abortSignal),
    }),
  );

/** Agent of the AI SDK that runs the tools with the model of the settings. */
export function createAgent(
  { apiKey, model, baseURL, reasoning }: AssistantSettings,
  tools: AssistantTools,
  onEnd?: ToolLoopAgentSettings["onEnd"],
): ToolLoopAgent<never, ToolSet> {
  // The Chat Completions API is implemented by OpenAI and every compatible server (llama.cpp, Ollama, vLLM, …),
  // and this provider surfaces the `reasoning_content` that reasoning models stream.
  const provider = createOpenAICompatible({
    name: "openai",
    baseURL,
    apiKey: apiKey || undefined,
    // Anthropic only allows browser requests with this opt-in header
    headers:
      URL.parse(baseURL)?.hostname === "api.anthropic.com"
        ? { "anthropic-dangerous-direct-browser-access": "true" }
        : undefined,
  });

  return new ToolLoopAgent({
    model: provider.chatModel(model),
    instructions: INSTRUCTIONS,
    tools: toolSet(tools),
    reasoning,
    stopWhen: isStepCount(32),
    onEnd,
  });
}
