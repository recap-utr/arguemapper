import { type ChatAdapter, type ChatMessage, createAiSdkAdapter } from "@mui/x-chat/headless";
import { createAgentUIStream, generateId, type InferAgentUIMessage } from "ai";
import { getErrorMessage } from "react-error-boundary";
import { createAgent } from "@/assistant/agent.js";
import { type AssistantSettings, resolveAssistantConfig } from "@/assistant/config.js";
import { graphTools } from "@/assistant/tools.js";
import { wikipediaTools } from "@/assistant/wikipedia.js";
import { assistantWorkspace, type DocumentStore, type WorkspaceStore } from "@/store.js";

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

/** MUI X Chat adapter that runs the assistant agent in the browser on the graphs of the workspace. */
export function createAssistantAdapter(
  workspace: WorkspaceStore,
  settings: AssistantSettings,
): ChatAdapter {
  // the config without the API key is the provenance of the edited nodes
  const provenance = resolveAssistantConfig(settings);
  const wikipedia = wikipediaTools("/api/wikipedia");

  return createAiSdkAdapter({
    stream: ({ messages, signal }) => {
      const edited = new Set<DocumentStore>();
      // tools without a graph id work on the graph shown when the reply started,
      // so that switching tabs during the reply does not redirect its edits
      const graphs = assistantWorkspace(workspace, {
        fallback: workspace.getState().active,
        onWrite: (doc) => edited.add(doc),
      });
      const agent = createAgent(
        settings,
        { ...graphTools(graphs, provenance), ...wikipedia },
        () => {
          for (const doc of edited) doc.setState({ shouldFitView: true });
        },
      );

      return createAgentUIStream({
        agent,
        uiMessages: messages.map(toUIMessage),
        abortSignal: signal,
        // MUI X Chat numbers replies without an id per adapter,
        // so a reply after a reload would be merged into a persisted one
        generateMessageId: generateId,
        // show the actual cause, e.g. a wrong API key, instead of a generic message
        onError: (error) => getErrorMessage(error) ?? String(error),
      });
    },
  });
}
