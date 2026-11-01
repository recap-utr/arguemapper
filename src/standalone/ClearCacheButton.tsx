import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Tooltip } from "@mui/material";
import { useConfirm } from "material-ui-confirm";

/** Standalone-only recovery action: wipes localStorage and reloads, for when persisted state breaks. */
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
          void confirm().then(({ confirmed }) => {
            if (confirmed) {
              localStorage.clear();
              window.location.reload();
            }
          });
        }}
      >
        Reset the app
      </Button>
    </Tooltip>
  );
};
