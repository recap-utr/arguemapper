import { Button, TextField } from "@mui/material";
import type React from "react";
import { type AssistantConfig, reasoningLevels } from "@/assistant/config.js";
import { BaseDialog } from "@/components/BaseDialog.js";
import { SelectField } from "@/components/SelectField.js";
import { useArgueActions, useArgueConfig, useWorkspace } from "@/store.js";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Assistant connection settings (API key, model, base URL, reasoning effort) not fixed by the host. */
export const AssistantSettingsDialog: React.FC<Props> = ({ open, onClose }) => {
  const { assistant: fixed = {} } = useArgueConfig();
  const assistantApiKey = useWorkspace((state) => state.assistantApiKey);
  const assistantConfig = useWorkspace((state) => state.assistantConfig);
  const { setWorkspace } = useArgueActions();
  const setConfig = (changes: Partial<AssistantConfig>) =>
    setWorkspace({ assistantConfig: { ...assistantConfig, ...changes } });

  return (
    <BaseDialog
      open={open}
      title="Assistant settings"
      onClose={onClose}
      actions={
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      }
    >
      {fixed.apiKey === undefined && (
        <TextField
          type="password"
          label="API key"
          helperText="Optional, local models usually need none"
          value={assistantApiKey}
          onChange={(event) => setWorkspace({ assistantApiKey: event.target.value })}
        />
      )}
      {fixed.model === undefined && (
        <TextField
          label="Model"
          value={assistantConfig.model}
          onChange={(event) => setConfig({ model: event.target.value })}
        />
      )}
      {fixed.baseURL === undefined && (
        <TextField
          label="Base URL"
          value={assistantConfig.baseURL}
          onChange={(event) => setConfig({ baseURL: event.target.value })}
        />
      )}
      {fixed.reasoning === undefined && (
        <SelectField
          label="Reasoning"
          value={assistantConfig.reasoning}
          options={reasoningLevels}
          onChange={(reasoning) => setConfig({ reasoning })}
        />
      )}
    </BaseDialog>
  );
};
