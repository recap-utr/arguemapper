import { createOpenAI } from "@ai-sdk/openai";
import { Chat } from "@ai-sdk/react";
import {
  DirectChatTransport,
  Experimental_Agent as Agent,
  type InferAgentUIMessage,
  stepCountIs,
} from "ai";
import { getSessionStorage } from "../../storage.js";
import { getState, setState } from "../../store.js";
import { tools } from "./tools.js";

const SYSTEM_PROMPT = `
You are an assistant that helps an analyst build and refine argument graphs.

An argument graph consists of:
- Atoms: argumentative discourse units (ADUs), i.e. the individual claims and premises.
- Scheme nodes: the inferences that connect arguments. Each scheme node has one or more premise nodes and a single conclusion node, and a type of support, attack, rephrase or preference. A scheme with several premises is a linked argument. Premises and conclusions are usually atoms, but they may also be other scheme nodes (e.g. an attack whose conclusion is another scheme node represents an undercutting attack on that inference).
- A major claim: the single root atom of the argument. It only appears as a conclusion, never as a premise.

Build a hierarchical graph rooted at the major claim. Avoid flat graphs where every atom links directly to the major claim, cycles, and orphaned atoms. Extract atoms verbatim from the source resources; do not rewrite their wording unless explicitly asked.

Tool usage:
- Call readGraph to inspect the current graph (atoms, scheme nodes with their premises/conclusion) before editing it, and listResources/readResource to read the source text.
- Prefer writeGraph to construct a whole graph in a single call; it is additive, so to regenerate from scratch call clearGraph first, then writeGraph. It keeps the conversation small.
- Use the single-item tools (writeAtom, writeScheme, editAtom, editScheme, editGraph, deleteAtom, deleteScheme) for surgical changes to an existing graph.

Briefly explain what you are doing and summarise the result for the analyst.
`.trim();

function assistantModel(apiKey: string) {
  const { model, baseURL } = getState().assistantConfig;
  return createOpenAI({ baseURL, apiKey })(model);
}

function openaiModel() {
  const apiKey = getSessionStorage<string>("assistantKey", "");
  if (apiKey === "") {
    throw new Error(
      "Cannot perform the request because the API key is missing. Open the inspector and set it under 'Assistant'.",
    );
  }
  return assistantModel(apiKey);
}

const agent = new Agent({
  // The model is a required setting; prepareCall overrides it per call with the current
  // runtime config, so an empty key here is fine (it only throws when actually sending).
  model: assistantModel(""),
  instructions: SYSTEM_PROMPT, // STATIC — keeps the cached prompt prefix stable across turns
  tools,
  stopWhen: stepCountIs(32),
  prepareCall: () => {
    // Only resolves runtime call settings (model client + reasoning effort) from the live config,
    // never the prompt, so the cached prefix is preserved for maximal KV-cache reuse.
    const { reasoningEffort } = getState().assistantConfig;
    return {
      model: openaiModel(),
      ...(reasoningEffort ? { providerOptions: { openai: { reasoningEffort } } } : {}),
    };
  },
  onFinish: () => {
    setState({ shouldFitView: true });
  },
});

export type AssistantUIMessage = InferAgentUIMessage<typeof agent>;

export const assistantChat = new Chat<AssistantUIMessage>({
  transport: new DirectChatTransport({ agent }),
});
