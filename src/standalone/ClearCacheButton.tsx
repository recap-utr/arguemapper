import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Tooltip } from "@mui/material";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog.js";

/** Remove everything the app stored and reload it, for when the stored state breaks it. */
export function resetApp(): void {
  // browsers throw on access if the site data is blocked, then nothing is stored
  try {
    localStorage.clear();
    sessionStorage.clear();
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
          startIcon={<FontAwesomeIcon icon={faTrash} />}
          variant="outlined"
          onClick={() => setOpen(true)}
        >
          Reset the app
        </Button>
      </Tooltip>
      <ConfirmDialog
        open={open}
        title="Reset the app?"
        description="This removes your graph, its undo history, the assistant conversation, and all settings. It cannot be undone."
        confirmText="Reset"
        destructive
        onConfirm={resetApp}
        onClose={() => setOpen(false)}
      />
    </>
  );
};
