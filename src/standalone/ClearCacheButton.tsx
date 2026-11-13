import DeleteIcon from "@mui/icons-material/Delete";
import { Button, Tooltip } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog.js";
import { resetApp } from "@/standalone/storage.js";

/** Standalone-only recovery action, see `resetApp`. */
export const ClearCacheButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip
        title="If errors occur, you can clear the stored data and reload the page with this button"
        describeChild
      >
        <Button
          color="error"
          startIcon={<DeleteIcon />}
          variant="outlined"
          onClick={() => setOpen(true)}
        >
          Reset the app
        </Button>
      </Tooltip>
      <ConfirmDialog
        open={open}
        title="Reset the app?"
        description="This closes all your graphs and removes them together with their undo history, the assistant conversation, and all settings. It cannot be undone."
        confirmText="Reset"
        destructive
        onConfirm={() => void resetApp()}
        onClose={() => setOpen(false)}
      />
    </>
  );
};
