import { faGear, faPaperPlane, faStop, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useChat } from "@ai-sdk/react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { type AssistantOptions, createAssistantChat } from "@/services/assistant/chat.js";
import { useArgueActions, useStore, useStoreApi } from "@/store.js";
import { MessagePart } from "@/components/assistant/MessagePart.js";
import ErrorBoundary from "@/components/ErrorBoundary.js";
import { AssistantSettingsDialog } from "@/components/sidebar/AssistantSettingsDialog.js";
import { SectionHeader } from "@/components/sidebar/SectionHeader.js";

const QUICK_ACTIONS: { label: string; prompt: string }[] = [
  {
    label: "Generate full graph",
    prompt:
      "Generate a complete argument graph from the selected resource: clear the current graph, then extract the ADUs as atoms, identify the major claim, and connect them with support/attack scheme nodes.",
  },
  {
    label: "Extract ADUs",
    prompt:
      "Clear the graph, then extract the argumentative discourse units from the selected resource and add them as atoms.",
  },
  {
    label: "Identify major claim",
    prompt: "Identify the major claim among the current atoms and set it.",
  },
  {
    label: "Predict relations",
    prompt:
      "Predict support/attack relations between the current atoms to form a hierarchical graph rooted at the major claim.",
  },
  {
    label: "Clean up structure",
    prompt:
      "Inspect the graph for structural issues (orphaned atoms, atoms not connected to the major claim, cycles) and fix them.",
  },
];

interface Props {
  options?: AssistantOptions;
  onClose: () => void;
}

export const Assistant: React.FC<Props> = ({ options = {}, onClose }) => {
  const { setState } = useArgueActions();
  const store = useStoreApi();
  // Depend on the individual settings (which fully determine the chat) rather than the `options`
  // object, so a fresh `options` literal from the host doesn't rebuild the whole chat each render.
  const { apiKey, model, baseURL, reasoningEffort } = options;
  // Bumped whenever the graph is replaced wholesale (load/import/new); watched below to reset the
  // conversation so a fresh graph starts a fresh chat.
  const graphResetToken = useStore((state) => state.graphResetToken);
  const chat = useMemo(
    () => createAssistantChat(store, { apiKey, model, baseURL, reasoningEffort }),
    [store, apiKey, model, baseURL, reasoningEffort],
  );
  const { messages, status, error, sendMessage, stop, setMessages } = useChat({ chat });
  const [input, setInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    setState({ assistantBusy: busy });
  }, [busy, setState]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Abort an in-flight stream when the panel unmounts or the chat is rebuilt, so a backgrounded
  // request can't keep calling tools and mutating the graph after teardown. Depend on `chat`
  // (stable across renders) rather than `stop`, whose identity could change and abort mid-stream.
  useEffect(() => () => void chat.stop(), [chat]);

  // When the graph is replaced wholesale (token bumps), abort any in-flight run and clear the live
  // transcript so a fresh graph starts a fresh conversation. The token guard makes this a no-op on
  // mount and on chat rebuilds (settings changes), which leave the token untouched.
  const lastResetToken = useRef(graphResetToken);
  useEffect(() => {
    if (lastResetToken.current === graphResetToken) return;
    lastResetToken.current = graphResetToken;
    void chat.stop();
    setMessages([]);
  }, [graphResetToken, chat, setMessages]);

  // Persist the transcript once a turn settles or is cleared. Gating on `!busy` avoids writing on
  // every streamed token, which would re-serialize the whole graph; `busy` flips false at stream end.
  useEffect(() => {
    if (!busy) setState({ assistantMessages: messages });
  }, [busy, messages, setState]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "" || busy) return;
    setInput("");
    void sendMessage({ text: trimmed });
  };

  return (
    <>
      <SectionHeader title="Assistant" onClose={onClose}>
        <Tooltip describeChild title="Clear conversation">
          <span>
            <IconButton
              size="small"
              disabled={busy || messages.length === 0}
              onClick={() => setMessages([])}
            >
              <FontAwesomeIcon icon={faTrashCan} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip describeChild title="Assistant settings">
          <IconButton size="small" onClick={() => setSettingsOpen(true)}>
            <FontAwesomeIcon icon={faGear} />
          </IconButton>
        </Tooltip>
      </SectionHeader>
      <AssistantSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
        {/* Contain a render error in the (model-generated) transcript to the panel: streamed markdown
            or tool output could otherwise throw and trip the app-wide boundary, crashing everything. */}
        <ErrorBoundary
          resetKeys={[messages.length]}
          fallback={(boundaryError, reset) => (
            <Stack spacing={1}>
              <Typography variant="body2" color="error">
                The conversation couldn't be displayed: {boundaryError.message}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setMessages([]);
                  reset();
                }}
              >
                Clear conversation
              </Button>
            </Stack>
          )}
        >
          <Stack spacing={2}>
            {messages.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Ask the assistant to build or refine your argument graph, or use a quick action
                below.
              </Typography>
            )}
            {messages.map((message) => (
              <Stack
                key={message.id}
                spacing={1}
                sx={{
                  alignSelf: message.role === "user" ? "flex-end" : "stretch",
                  maxWidth: message.role === "user" ? "85%" : "100%",
                  bgcolor: message.role === "user" ? "action.selected" : "transparent",
                  borderRadius: 2,
                  px: message.role === "user" ? 1.5 : 0,
                  py: message.role === "user" ? 1 : 0,
                }}
              >
                {message.parts.map((part, index) => (
                  <MessagePart key={`${message.id}-${index}`} part={part} />
                ))}
              </Stack>
            ))}
            {error && (
              <Typography variant="body2" color="error">
                {error.message}
              </Typography>
            )}
          </Stack>
        </ErrorBoundary>
      </Box>

      <Box sx={{ p: 1.5, borderTop: 1, borderColor: "divider", flexShrink: 0 }}>
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1 }}>
          {QUICK_ACTIONS.map((action) => (
            <Chip
              key={action.label}
              label={action.label}
              size="small"
              onClick={() => send(action.prompt)}
              disabled={busy}
            />
          ))}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={5}
            size="small"
            placeholder="Message the assistant…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(input);
              }
            }}
          />
          {busy ? (
            <Tooltip title="Stop">
              <IconButton color="error" onClick={() => stop()}>
                <FontAwesomeIcon icon={faStop} />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Send">
              <span>
                <IconButton
                  color="primary"
                  disabled={input.trim() === ""}
                  onClick={() => send(input)}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Box>
    </>
  );
};

export default Assistant;
