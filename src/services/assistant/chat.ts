import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Chat } from "@ai-sdk/react";
import {
  DirectChatTransport,
  Experimental_Agent as Agent,
  type InferAgentUIMessage,
  stepCountIs,
} from "ai";
import type { ArgueStore, ReasoningEffort } from "@/store.js";
import { createTools } from "@/services/assistant/tools.js";

const SYSTEM_PROMPT = `
You are an assistant that helps an analyst build and refine argument graphs.

An argument graph consists of:
- Atoms: argumentative discourse units (ADUs), i.e. the individual claims and premises.
- Scheme nodes: the inferences that connect arguments. Each scheme node has one or more premise nodes and a single conclusion node, and a type of support, attack, rephrase or preference. A scheme with several premises is a linked argument. Premises and conclusions are usually atoms, but they may also be other scheme nodes (e.g. an attack whose conclusion is another scheme node represents an undercutting attack on that inference).
- A major claim: the single root atom of the argument. It only appears as a conclusion, never as a premise.
- Participants: the people behind the argument (e.g. the speakers in a debate). Each atom may be attributed to one participant.

Build a single connected, hierarchical graph rooted at the major claim. Avoid flat graphs where every atom links directly to the major claim, cycles, orphaned atoms, and disconnected subgraphs (clusters of atoms not joined to the rest of the argument).

Quote atom text verbatim from the source resources so each atom links back to its original span; do not rewrite the wording unless explicitly asked. An atom's original-text reference is recorded only when its text is found verbatim in a resource — if you must paraphrase, the atom simply carries no reference rather than a wrong one.

Briefly explain what you are doing and summarise the result for the analyst.
`.trim();

export interface AssistantOptions {
  /** API key. If omitted, the live `assistantApiKey` from the store is used (standalone). */
  apiKey?: string;
  model?: string;
  baseURL?: string;
  reasoningEffort?: ReasoningEffort;
}

function buildAgent(store: ArgueStore, options: AssistantOptions) {
  // Cache the provider across the turn's up-to-32 `prepareCall` steps; only baseURL/apiKey affect it,
  // so it's rebuilt only when those change rather than on every step.
  let cached:
    | { baseURL: string; apiKey: string; provider: ReturnType<typeof createOpenAICompatible> }
    | undefined;
  const resolveModel = (apiKey: string) => {
    const config = store.getState().assistantConfig;
    const baseURL = options.baseURL ?? config.baseURL;
    const model = options.model ?? config.model;
    // Target the Chat Completions endpoint (`/chat/completions`), the universal standard implemented by
    // OpenAI and every compatible server (llama.cpp, Ollama, vLLM, …). Unlike `@ai-sdk/openai`'s chat
    // model, this provider parses the `reasoning_content` delta that reasoning models stream, surfacing
    // it as reasoning UI parts. The key is optional — the Authorization header is omitted when it is
    // empty, which is what local servers expect.
    if (cached?.baseURL !== baseURL || cached.apiKey !== apiKey) {
      cached = {
        baseURL,
        apiKey,
        provider: createOpenAICompatible({
          name: "openai",
          baseURL,
          apiKey: apiKey || undefined,
          // Anthropic gates browser CORS behind this opt-in header; other providers don't need it,
          // so it's omitted to avoid an unnecessary preflight.
          headers: baseURL.includes("api.anthropic.com")
            ? { "anthropic-dangerous-direct-browser-access": "true" }
            : undefined,
        }),
      };
    }
    const { provider } = cached;
    return provider.chatModel(model);
  };

  return new Agent({
    // The model is a required setting; prepareCall overrides it per call with the current
    // runtime config, so an empty key here is fine (it only throws when actually sending).
    model: resolveModel(""),
    instructions: SYSTEM_PROMPT, // STATIC — keeps the cached prompt prefix stable across turns
    tools: createTools(store),
    stopWhen: stepCountIs(32),
    prepareCall: (call) => {
      // The SDK uses the returned object as the full call args, so spread the incoming `call`
      // (messages, static instructions, tools, …) and override only the runtime settings resolved
      // from the live config. The prompt prefix is passed through untouched for KV-cache reuse.
      const apiKey = options.apiKey ?? store.getState().assistantApiKey;
      const reasoningEffort =
        options.reasoningEffort ?? store.getState().assistantConfig.reasoningEffort;
      return {
        ...call,
        model: resolveModel(apiKey),
        ...(reasoningEffort ? { providerOptions: { openai: { reasoningEffort } } } : {}),
      };
    },
    onFinish: () => {
      store.setState({ shouldFitView: true });
    },
  });
}

type AssistantAgent = ReturnType<typeof buildAgent>;
export type AssistantUIMessage = InferAgentUIMessage<AssistantAgent>;

/** Create a chat bound to a specific instance's store and assistant configuration. */
export function createAssistantChat(
  store: ArgueStore,
  options: AssistantOptions,
): Chat<AssistantUIMessage> {
  return new Chat<AssistantUIMessage>({
    // Seed from the persisted transcript so reloads — and chat rebuilds on config changes — restore it.
    messages: store.getState().assistantMessages as AssistantUIMessage[],
    transport: new DirectChatTransport({ agent: buildAgent(store, options) }),
  });
}
