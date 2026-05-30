import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, IconButton, Stack } from "@mui/material";
import { type SnackbarAction, type SnackbarKey, useSnackbar } from "notistack";
import { useCallback, useEffect } from "react";
import { generateDemo } from "../services/demo.js";
import { useArgueActions, useStore } from "../store.js";

/** Standalone-only onboarding prompt offering to load the demo on first visit. */
export const WelcomeSnackbar: React.FC = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { setState, resetState } = useArgueActions();
  const firstVisit = useStore((state) => state.firstVisit);

  const snackbarAction: SnackbarAction = useCallback(
    (key: SnackbarKey) => (
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          disableElevation
          variant="contained"
          onClick={() => {
            resetState(generateDemo());
            closeSnackbar(key);
            setState({ firstVisit: false });
          }}
        >
          Load Demo
        </Button>
        <IconButton
          onClick={() => {
            closeSnackbar(key);
            setState({ firstVisit: false });
          }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </IconButton>
      </Stack>
    ),
    [closeSnackbar, resetState, setState],
  );

  useEffect(() => {
    if (firstVisit) {
      enqueueSnackbar(
        "Hi there! If you are using this app for the first time, you may want to load our demo.",
        {
          key: "welcome",
          persist: true,
          variant: "info",
          action: snackbarAction,
        },
      );
    }
  }, [enqueueSnackbar, firstVisit, snackbarAction]);

  return null;
};
