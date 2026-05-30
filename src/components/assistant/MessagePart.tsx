import {
  faCheck,
  faChevronDown,
  faGear,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import {
  getToolOrDynamicToolName,
  isReasoningUIPart,
  isTextUIPart,
  isToolOrDynamicToolUIPart,
} from "ai";
import type React from "react";
import type { AssistantUIMessage } from "../../services/assistant/chat.js";
import { Markdown } from "./Markdown.js";

type Part = AssistantUIMessage["parts"][number];

const summarize = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
};

export const MessagePart: React.FC<{ part: Part }> = ({ part }) => {
  if (isTextUIPart(part)) {
    return <Markdown>{part.text}</Markdown>;
  }

  if (isReasoningUIPart(part)) {
    if (!part.text) return null;
    return (
      <Accordion disableGutters sx={{ bgcolor: "action.hover", boxShadow: "none" }}>
        <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
          <Typography variant="caption" color="text.secondary">
            <FontAwesomeIcon icon={faGear} />
            &nbsp;Reasoning
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
            {part.text}
          </Typography>
        </AccordionDetails>
      </Accordion>
    );
  }

  if (isToolOrDynamicToolUIPart(part)) {
    const name = getToolOrDynamicToolName(part);
    const running = part.state === "input-streaming" || part.state === "input-available";
    const output =
      part.state === "output-available" ? (part.output as { ok?: boolean } | null) : null;
    const failed = part.state === "output-error" || output?.ok === false;

    const detail =
      part.state === "output-error"
        ? part.errorText
        : summarize(part.input) || summarize(part.output);

    return (
      <Chip
        size="small"
        variant="outlined"
        color={failed ? "error" : running ? "default" : "success"}
        icon={
          <Box sx={{ display: "flex", pl: 0.5 }}>
            {running ? (
              <CircularProgress size={12} />
            ) : (
              <FontAwesomeIcon icon={failed ? faTriangleExclamation : faCheck} />
            )}
          </Box>
        }
        label={
          <Typography variant="caption" component="span">
            <strong>{name}</strong>
            {detail ? ` · ${detail}` : ""}
          </Typography>
        }
        sx={{ maxWidth: 1, height: "auto", py: 0.5, "& .MuiChip-label": { whiteSpace: "normal" } }}
      />
    );
  }

  return null;
};
