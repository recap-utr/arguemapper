import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import type React from "react";
import { type AssistantConfig, useArgueActions, useStore } from "@/store.js";

const reasoningLevels: readonly (readonly [AssistantConfig["reasoning"], string])[] = [
  ["low", "Low"],
  ["medium", "Medium"],
  ["high", "High"],
];

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Assistant connection settings (API key, model, base URL, reasoning effort). */
export const AssistantSettingsDialog: React.FC<Props> = ({ open, onClose }) => {
  const assistantApiKey = useStore((state) => state.assistantApiKey);
  const assistantConfig = useStore((state) => state.assistantConfig);
  const { setState } = useArgueActions();
  const setConfig = (changes: Partial<AssistantConfig>) =>
    setState({ assistantConfig: { ...assistantConfig, ...changes } });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Assistant Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            type="password"
            label="API Key"
            helperText="Optional — not required for local models"
            value={assistantApiKey}
            onChange={(event) => {
              setState({ assistantApiKey: event.target.value });
            }}
          />
          <TextField
            fullWidth
            type="text"
            label="Model"
            value={assistantConfig.model}
            onChange={(event) => {
              setConfig({ model: event.target.value });
            }}
          />
          <TextField
            fullWidth
            type="text"
            label="Base URL"
            value={assistantConfig.baseURL}
            onChange={(event) => {
              setConfig({ baseURL: event.target.value });
            }}
          />
          <TextField
            fullWidth
            select
            label="Reasoning"
            value={assistantConfig.reasoning}
            onChange={(event) => {
              const level = reasoningLevels.find(([value]) => value === event.target.value);

              if (level !== undefined) {
                setConfig({ reasoning: level[0] });
              }
            }}
          >
            {reasoningLevels.map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssistantSettingsDialog;
