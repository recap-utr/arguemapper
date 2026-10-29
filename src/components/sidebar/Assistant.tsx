import { faGear, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton, Tooltip } from "@mui/material";
import { ChatBox } from "@mui/x-chat";
import type { ChatSuggestion } from "@mui/x-chat/headless";
import type React from "react";
import { useMemo, useState } from "react";
import { type AssistantOptions, createAssistantAdapter } from "@/services/assistant/chat.js";
import { resetConversation, useArgueActions, useStore, useStoreApi } from "@/store.js";
import { AssistantSettingsDialog } from "@/components/sidebar/AssistantSettingsDialog.js";
import { SectionHeader } from "@/components/sidebar/SectionHeader.js";

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
  onClose: () => void;
}

export const Assistant: React.FC<Props> = ({ options = {}, onClose }) => {
  const store = useStoreApi();
  const { setState } = useArgueActions();
  const messages = useStore((state) => state.assistantMessages);
  const conversation = useStore((state) => state.assistantConversation);
  const config = useStore((state) => state.assistantConfig);
  const storedApiKey = useStore((state) => state.assistantApiKey);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    <>
      <SectionHeader title="Assistant" onClose={onClose}>
        <Tooltip describeChild title="Clear conversation">
          <span>
            <IconButton
              size="small"
              disabled={messages.length === 0}
              onClick={() => resetConversation(store)}
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
        slots={{ messageAvatar: null }}
        sx={{ flexGrow: 1, minHeight: 0 }}
      />
    </>
  );
};

export default Assistant;
