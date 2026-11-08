import DeleteIcon from "@mui/icons-material/Delete";
import { Button, Tooltip } from "@mui/material";
import { useState } from "react";
import { PERSIST_KEY } from "@/App.js";
import { ConfirmDialog } from "@/components/ConfirmDialog.js";
import { clearSession } from "@/store/persistence.js";

/** Remove everything the app stored and reload it, for when the stored state breaks it. */
export async function resetApp(): Promise<void> {
  // browsers throw on access if the site data is blocked, then nothing is stored
  try {
    localStorage.clear();
    await clearSession(PERSIST_KEY);
  } catch {}

  window.location.reload();
}

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
