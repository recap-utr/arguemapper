import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { type ChatAdapter, type ChatMessage, createAiSdkAdapter } from "@mui/x-chat/headless";
import {
  createAgentUIStream,
  generateId,
  type InferAgentUIMessage,
  isStepCount,
  ToolLoopAgent,
} from "ai";
import type { ArgueStore, AssistantConfig } from "@/store.js";
import { createTools } from "@/services/assistant/tools.js";

const SYSTEM_PROMPT = `
You are an assistant that helps an analyst build and refine argument graphs.

An argument graph consists of:
- Atoms: argumentative discourse units (ADUs), i.e. the individual claims and premises.
- Schemes: inferences of type support, attack, rephrase or preference from one or more premise atoms to a single conclusion. A scheme with several premises is a linked argument. The conclusion is usually an atom, but it may be another scheme, e.g. an attack on a scheme undercuts that inference.
- A major claim: the single root atom of the argument. It only appears as a conclusion, never as a premise.
- Participants: the people behind the argument (e.g. the speakers in a debate). Each atom may be attributed to one participant.

Build a single connected, hierarchical graph rooted at the major claim. Avoid flat graphs where every atom links directly to the major claim, cycles, orphaned atoms, and disconnected parts.

Read the graph with readGraph and change it with editGraph, which accepts all changes of a step at once. Use short ids of your own such as a1 or s1 for new elements. Quote atom texts verbatim from the resources, so that they are linked to their source. If editGraph fails, nothing was changed: fix the items its errors name and call it again. Act on the returned warnings and issues until the graph is sound.

Briefly explain what you are doing and summarise the result for the analyst.
`.trim();

/** Connection and model settings of the assistant. */
export interface AssistantSettings extends AssistantConfig {
  /** Optional, local servers usually need none. */
  apiKey: string;
}

/** Settings of the host, they take precedence over the ones of the store. */
export type AssistantOptions = Partial<AssistantSettings>;

function createAgent(store: ArgueStore, { apiKey, model, baseURL, reasoning }: AssistantSettings) {
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
    instructions: SYSTEM_PROMPT,
    tools: createTools(store),
    reasoning,
    stopWhen: isStepCount(32),
    onEnd: () => store.setState({ shouldFitView: true }),
  });
}

type AssistantUIMessage = InferAgentUIMessage<ReturnType<typeof createAgent>>;
type AssistantUIPart = AssistantUIMessage["parts"][number];

/**
 * The AI SDK message of a MUI X Chat message.
 * MUI X Chat mirrors the parts of the AI SDK, except that tool invocations are nested,
 * so the parts are only regrouped and the casts mark this structural boundary.
 * Tool calls without a result, e.g. of an aborted reply, are dropped as providers reject them,
 * like `ignoreIncompleteToolCalls` of `convertToModelMessages` does.
 */
function toUIMessage({ id, role, parts, metadata }: ChatMessage): AssistantUIMessage {
  return {
    id,
    role,
    metadata,
    parts: parts.flatMap((part): AssistantUIPart[] => {
      switch (part.type) {
        case "tool":
        case "dynamic-tool": {
          const { toolName, ...invocation } = part.toolInvocation;

          if (!invocation.state.startsWith("output-")) {
            return [];
          }

          const type = part.type === "tool" ? `tool-${toolName}` : "dynamic-tool";
          return [{ type, toolName, ...invocation } as AssistantUIPart];
        }
        default:
          return [part as AssistantUIPart];
      }
    }),
  };
}

/** MUI X Chat adapter that runs the assistant agent in the browser. */
export function createAssistantAdapter(
  store: ArgueStore,
  settings: AssistantSettings,
): ChatAdapter {
  const agent = createAgent(store, settings);

  return createAiSdkAdapter({
    stream: ({ messages, signal }) =>
      createAgentUIStream({
        agent,
        uiMessages: messages.map(toUIMessage),
        abortSignal: signal,
        // MUI X Chat numbers replies without an id per adapter,
        // so a reply after a reload would be merged into a persisted one
        generateMessageId: generateId,
        // show the actual cause, e.g. a wrong API key, instead of a generic message
        onError: (error) => (error instanceof Error ? error.message : String(error)),
      }),
  });
}
