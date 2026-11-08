import { faChevronDown, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { ChatBox, ChatComposerToolbar, type ChatComposerToolbarProps } from "@mui/x-chat";
import type { ChatSuggestion } from "@mui/x-chat/headless";
import type React from "react";
import { useMemo, useState } from "react";
import type { AssistantSettings } from "@/assistant/config.js";
import { PROMPTS } from "@/assistant/instructions.js";
import { createAssistantAdapter } from "@/components/panels/chatAdapter.js";
import {
  resetConversation,
  useArgueActions,
  useArgueConfig,
  useStore,
  useStoreApi,
} from "@/store.js";
import { AssistantSettingsDialog } from "@/components/panels/AssistantSettingsDialog.js";

const SUGGESTIONS: ChatSuggestion[] = PROMPTS.map(({ title, text }) => ({
  label: title,
  value: text,
}));

const settingKeys = [
  "apiKey",
  "model",
  "baseURL",
  "reasoning",
] as const satisfies readonly (keyof AssistantSettings)[];

/**
 * The settings of the assistant, the ones fixed by the host take precedence over the user's,
 * who can edit the settings if the host does not fix all of them.
 */
function useAssistantSettings(): { settings: AssistantSettings; editable: boolean } {
  const { assistant: fixed = {} } = useArgueConfig();
  const config = useStore((state) => state.assistantConfig);
  const apiKey = useStore((state) => state.assistantApiKey);

  return {
    settings: {
      apiKey: fixed.apiKey ?? apiKey,
      model: fixed.model ?? config.model,
      baseURL: fixed.baseURL ?? config.baseURL,
      reasoning: fixed.reasoning ?? config.reasoning,
    },
    editable: settingKeys.some((key) => fixed[key] === undefined),
  };
}

/** Toolbar of the composer with the actions of the conversation left of the send button. */
const ComposerToolbar: React.FC<ChatComposerToolbarProps> = ({ children, ...props }) => {
  const store = useStoreApi();
  const empty = useStore((state) => state.assistantMessages.length === 0);
  const {
    settings: { model },
    editable,
  } = useAssistantSettings();
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
            endIcon={editable && <FontAwesomeIcon icon={faChevronDown} />}
            disabled={!editable}
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

export const Assistant: React.FC = () => {
  const store = useStoreApi();
  const { setState } = useArgueActions();
  const messages = useStore((state) => state.assistantMessages);
  // MUI X Chat takes a mutable array
  const chatMessages = useMemo(() => [...messages], [messages]);
  const conversation = useStore((state) => state.assistantConversation);
  // the individual settings determine the agent, a fresh settings object must not rebuild it
  const { apiKey, model, baseURL, reasoning } = useAssistantSettings().settings;
  const adapter = useMemo(
    () => createAssistantAdapter(store, { apiKey, model, baseURL, reasoning }),
    [store, apiKey, model, baseURL, reasoning],
  );

  return (
    <ChatBox
      // remounting starts the conversation afresh and aborts a running reply
      key={conversation}
      adapter={adapter}
      messages={chatMessages}
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
