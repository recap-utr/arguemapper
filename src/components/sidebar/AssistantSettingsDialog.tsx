import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { startCase } from "lodash";
import type React from "react";
import {
  assistantModels,
  type ReasoningEffort,
  reasoningEfforts,
  useArgueActions,
  useStore,
} from "../../store.js";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Assistant connection settings (API key, model, base URL, reasoning effort). */
export const AssistantSettingsDialog: React.FC<Props> = ({ open, onClose }) => {
  const assistantApiKey = useStore((state) => state.assistantApiKey);
  const assistantConfig = useStore((state) => state.assistantConfig);
  const { setState, mutate } = useArgueActions();

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
          <Autocomplete
            freeSolo
            options={assistantModels}
            renderInput={(params) => <TextField {...params} label="Model" />}
            inputValue={assistantConfig.model}
            onInputChange={(_event, value) => {
              mutate((draft) => {
                draft.assistantConfig.model = value;
              });
            }}
          />
          <TextField
            fullWidth
            type="text"
            label="Base URL"
            value={assistantConfig.baseURL}
            onChange={(event) => {
              mutate((draft) => {
                draft.assistantConfig.baseURL = event.target.value;
              });
            }}
          />
          <TextField
            fullWidth
            select
            label="Reasoning Effort"
            value={assistantConfig.reasoningEffort ?? "auto"}
            onChange={(event) => {
              mutate((draft) => {
                const { value } = event.target;
                draft.assistantConfig.reasoningEffort =
                  value === "auto" ? undefined : (value as ReasoningEffort);
              });
            }}
          >
            {reasoningEfforts.map((effort) => (
              <MenuItem key={effort ?? "auto"} value={effort ?? "auto"}>
                {startCase(effort ?? "auto")}
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
