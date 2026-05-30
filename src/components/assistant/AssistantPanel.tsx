import {
  faPaperPlane,
  faRobot,
  faStop,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { assistantChat } from "../../services/assistant/chat.js";
import { setState, useStore } from "../../store.js";
import { MessagePart } from "./MessagePart.js";

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

export const AssistantPanel: React.FC = () => {
  const open = useStore((state) => state.assistantPanelOpen);
  const { messages, status, error, sendMessage, stop, setMessages } = useChat({ chat: assistantChat });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    setState({ assistantBusy: busy });
  }, [busy]);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "" || busy) return;
    setInput("");
    void sendMessage({ text: trimmed });
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        right: 16,
        bottom: 72,
        zIndex: (theme) => theme.zIndex.drawer + 2,
        width: 400,
        maxWidth: "calc(100vw - 32px)",
        height: 560,
        maxHeight: "calc(100vh - 96px)",
        display: open ? "flex" : "none",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider", alignItems: "center" }}
      >
        <FontAwesomeIcon icon={faRobot} />
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
          Assistant
        </Typography>
        <Tooltip title="Clear conversation">
          <span>
            <IconButton size="small" disabled={busy || messages.length === 0} onClick={() => setMessages([])}>
              <FontAwesomeIcon icon={faTrashCan} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Hide">
          <IconButton size="small" onClick={() => setState({ assistantPanelOpen: false })}>
            <FontAwesomeIcon icon={faXmark} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
        <Stack spacing={2}>
          {messages.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Ask the assistant to build or refine your argument graph, or use a quick action below.
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
      </Box>

      <Box sx={{ p: 1.5, borderTop: 1, borderColor: "divider" }}>
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
                <IconButton color="primary" disabled={input.trim() === ""} onClick={() => send(input)}>
                  <FontAwesomeIcon icon={faPaperPlane} />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

export default AssistantPanel;
