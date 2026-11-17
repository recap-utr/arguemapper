import DeleteIcon from "@mui/icons-material/Delete";
import { Alert, AlertTitle, Button, Stack, Tooltip } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { resetApp } from "@/standalone/storage.js";

/** Standalone-only recovery action, see `resetApp`, confirmed in place. */
export const ClearCacheButton: React.FC = () => {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <Alert severity="error">
        <AlertTitle>Reset the app?</AlertTitle>
        This closes all your graphs and removes them together with their undo history, the assistant
        conversation, and all settings. It cannot be undone.
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button size="small" color="inherit" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button size="small" variant="contained" color="error" onClick={() => void resetApp()}>
            Reset
          </Button>
        </Stack>
      </Alert>
    );
  }

  return (
    <Tooltip
      title="If errors occur, you can clear the stored data and reload the page with this button"
      describeChild
    >
      <Button
        color="error"
        startIcon={<DeleteIcon />}
        variant="outlined"
        onClick={() => setConfirming(true)}
      >
        Reset the app
      </Button>
    </Tooltip>
  );
};
