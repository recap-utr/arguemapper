import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import * as arguebuf from "arguebuf";
import type React from "react";
import { useMemo } from "react";
import { useArgueActions, useStore } from "@/store.js";

interface Props {
  /** When a function, the dialog is open; on save it runs, then `disableCallback` is invoked. */
  callback: (() => void) | undefined;
  disableCallback: () => void;
}

/** Collects the analyst's name/email, gating exports until both are provided. */
export const AnalystDialog: React.FC<Props> = ({ callback, disableCallback }) => {
  const analyst = useStore((state) => state.analyst);
  const { setState } = useArgueActions();

  const callbackIsFunction = useMemo(() => typeof callback === "function", [callback]);
  const onConfirm = () => {
    if (typeof callback === "function") {
      callback();
    }
    disableCallback();
  };

  const description = !(analyst.name && analyst.email)
    ? "Before exporting your work, you need to provide your name and email to be exported with the graph. Afterwards, click the export button again."
    : "Please enter your name and and email for storing together with the exported argument graph.";

  return (
    <Dialog open={callbackIsFunction} onClose={disableCallback}>
      <DialogTitle>Analyst Information</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
        <TextField
          label="Name"
          fullWidth
          margin="dense"
          value={analyst.name ?? ""}
          onChange={(event) => {
            const { value } = event.target;
            setState((state) => ({ analyst: state.analyst.with({ name: value }) }));
          }}
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="dense"
          value={analyst.email ?? ""}
          onChange={(event) => {
            const { value } = event.target;
            setState((state) => ({ analyst: state.analyst.with({ email: value }) }));
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          color="error"
          onClick={() => {
            setState({ analyst: new arguebuf.Analyst({}) });
          }}
        >
          Clear
        </Button>
        <Button onClick={onConfirm}>Save and close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnalystDialog;
