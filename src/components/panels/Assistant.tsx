import EditNoteIcon from "@mui/icons-material/EditNote";
import SettingsIcon from "@mui/icons-material/Settings";
import { Button, Stack, Tooltip, Typography } from "@mui/material";
import { ChatBox, ChatComposerToolbar, type ChatComposerToolbarProps } from "@mui/x-chat";
import type { ChatSuggestion } from "@mui/x-chat/headless";
import type React from "react";
import { type AssistantSettings, hasEditableSettings } from "@/assistant/config.js";
import { PROMPTS } from "@/assistant/instructions.js";
import { createAssistantAdapter } from "@/components/panels/chatAdapter.js";
import { TooltipIconButton } from "@/components/TooltipIconButton.js";
import {
  resetConversation,
  useArgueActions,
  useArgueConfig,
  useWorkspace,
  useWorkspaceApi,
} from "@/store.js";

const SUGGESTIONS: ChatSuggestion[] = PROMPTS.map(({ title, text }) => ({
  label: title,
  value: text,
}));

/**
 * The settings of the assistant, the ones fixed by the host take precedence over the user's,
 * who can edit the settings if the host does not fix all of them.
 */
function useAssistantSettings(): { settings: AssistantSettings; editable: boolean } {
  const { assistant } = useArgueConfig();
  const fixed = assistant ?? {};
  const config = useWorkspace((state) => state.assistantConfig);
  const apiKey = useWorkspace((state) => state.assistantApiKey);

  return {
    settings: {
      apiKey: fixed.apiKey ?? apiKey,
      model: fixed.model ?? config.model,
      baseURL: fixed.baseURL ?? config.baseURL,
      reasoning: fixed.reasoning ?? config.reasoning,
    },
    editable: hasEditableSettings(assistant),
  };
}

/** Toolbar of the composer with the actions of the conversation left of the send button. */
const ComposerToolbar: React.FC<ChatComposerToolbarProps> = ({ children, ...props }) => {
  const store = useWorkspaceApi();
  const empty = useWorkspace((state) => state.assistantMessages.length === 0);
  const {
    settings: { model },
    editable,
  } = useAssistantSettings();
  const { openPanel } = useArgueActions();

  return (
    <ChatComposerToolbar {...props}>
      <Stack direction="row" sx={{ alignItems: "center", minWidth: 0, color: "text.secondary" }}>
        <TooltipIconButton
          title="New conversation"
          icon={EditNoteIcon}
          size="small"
          color="inherit"
          disabled={empty}
          onClick={() => resetConversation(store)}
        />
        <Tooltip describeChild title="Assistant settings">
          <Button
            size="small"
            color="inherit"
            endIcon={editable && <SettingsIcon />}
            disabled={!editable}
            onClick={() => openPanel("settings")}
            sx={{ minWidth: 0, textTransform: "none" }}
          >
            <Typography variant="inherit" noWrap>
              {model}
            </Typography>
          </Button>
        </Tooltip>
      </Stack>
      {children}
    </ChatComposerToolbar>
  );
};

export const Assistant: React.FC = () => {
  const store = useWorkspaceApi();
  const { setWorkspace } = useArgueActions();
  const messages = useWorkspace((state) => state.assistantMessages);
  // MUI X Chat takes a mutable array
  const chatMessages = [...messages];
  const conversation = useWorkspace((state) => state.assistantConversation);
  const { settings } = useAssistantSettings();
  const adapter = createAssistantAdapter(store, settings);

  return (
    <ChatBox
      // remounting starts the conversation afresh and aborts a running reply
      key={conversation}
      adapter={adapter}
      messages={chatMessages}
      onMessagesChange={(next) => setWorkspace({ assistantMessages: next })}
      suggestions={SUGGESTIONS}
      suggestionsAutoSubmit
      // a single conversation without attachments in a narrow pane, errors show on the message
      features={{ conversationHeader: false, attachments: false, helperText: false }}
      slots={{ messageAvatar: null, composerToolbar: ComposerToolbar }}
      sx={{ flexGrow: 1, minHeight: 0 }}
    />
  );
};
