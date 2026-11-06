import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Tooltip } from "@mui/material";
import { useConfirm } from "material-ui-confirm";

/** Remove everything the app stored and reload it, for when the stored state breaks it. */
export function resetApp(): void {
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
}

/** Standalone-only recovery action, see `resetApp`. */
export const ClearCacheButton: React.FC = () => {
  const confirm = useConfirm();

  return (
    <Tooltip
      title="If errors occur, you can clear your browser's cache and reload the page with this button"
      describeChild
    >
      <Button
        color="error"
        startIcon={<FontAwesomeIcon icon={faTrash} />}
        variant="outlined"
        onClick={() => {
          void confirm().then(({ confirmed }) => confirmed && resetApp());
        }}
      >
        Reset the app
      </Button>
    </Tooltip>
  );
};
