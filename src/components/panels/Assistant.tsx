import { faChevronDown, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { ChatBox, ChatComposerToolbar, type ChatComposerToolbarProps } from "@mui/x-chat";
import type { ChatSuggestion } from "@mui/x-chat/headless";
import type React from "react";
import { useMemo, useState } from "react";
import { type AssistantOptions, createAssistantAdapter } from "@/services/assistant/chat.js";
import { resetConversation, useArgueActions, useStore, useStoreApi } from "@/store.js";
import { AssistantSettingsDialog } from "@/components/panels/AssistantSettingsDialog.js";

const SUGGESTIONS: ChatSuggestion[] = [
  {
    label: "Generate full graph",
    value:
      "Generate a complete argument graph from the selected resource: clear the current graph, then extract the ADUs as atoms, identify the major claim, and connect them with support/attack scheme nodes.",
  },
  {
    label: "Extract ADUs",
    value:
      "Clear the graph, then extract the argumentative discourse units from the selected resource and add them as atoms.",
  },
  {
    label: "Identify major claim",
    value: "Identify the major claim among the current atoms and set it.",
  },
  {
    label: "Predict relations",
    value:
      "Predict support/attack relations between the current atoms to form a hierarchical graph rooted at the major claim.",
  },
  {
    label: "Clean up structure",
    value:
      "Inspect the graph for structural issues (orphaned atoms, atoms not connected to the major claim, cycles) and fix them.",
  },
];

interface Props {
  options?: AssistantOptions;
}

/** Toolbar of the composer with the actions of the conversation left of the send button. */
const ComposerToolbar: React.FC<ChatComposerToolbarProps> = ({ children, ...props }) => {
  const store = useStoreApi();
  const empty = useStore((state) => state.assistantMessages.length === 0);
  const model = useStore((state) => state.assistantConfig.model);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <ChatComposerToolbar {...props}>
      <Stack direction="row" sx={{ alignItems: "center", minWidth: 0, color: "text.secondary" }}>
        <Tooltip describeChild title="New conversation">
          <span>
            <IconButton
              size="small"
              color="inherit"
              disabled={empty}
              onClick={() => resetConversation(store)}
            >
              <FontAwesomeIcon icon={faPenToSquare} fixedWidth />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip describeChild title="Assistant settings">
          <Button
            size="small"
            color="inherit"
            endIcon={<FontAwesomeIcon icon={faChevronDown} />}
            onClick={() => setSettingsOpen(true)}
            sx={{ minWidth: 0, textTransform: "none" }}
          >
            <Typography variant="inherit" noWrap>
              {model}
            </Typography>
          </Button>
        </Tooltip>
      </Stack>
      <AssistantSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {children}
    </ChatComposerToolbar>
  );
};

export const Assistant: React.FC<Props> = ({ options = {} }) => {
  const store = useStoreApi();
  const { setState } = useArgueActions();
  const messages = useStore((state) => state.assistantMessages);
  const conversation = useStore((state) => state.assistantConversation);
  const config = useStore((state) => state.assistantConfig);
  const storedApiKey = useStore((state) => state.assistantApiKey);
  // the individual settings determine the agent, a fresh `options` object must not rebuild it
  const {
    apiKey = storedApiKey,
    model = config.model,
    baseURL = config.baseURL,
    reasoning = config.reasoning,
  } = options;
  const adapter = useMemo(
    () => createAssistantAdapter(store, { apiKey, model, baseURL, reasoning }),
    [store, apiKey, model, baseURL, reasoning],
  );

  return (
    <ChatBox
      // remounting starts the conversation afresh and aborts a running reply
      key={conversation}
      adapter={adapter}
      messages={messages}
      onMessagesChange={(next) => setState({ assistantMessages: next })}
      suggestions={SUGGESTIONS}
      suggestionsAutoSubmit
      // a single conversation without attachments in a narrow pane, errors show on the message
      features={{ conversationHeader: false, attachments: false, helperText: false }}
      slots={{ messageAvatar: null, composerToolbar: ComposerToolbar }}
      sx={{ flexGrow: 1, minHeight: 0 }}
    />
  );
};

export default Assistant;
