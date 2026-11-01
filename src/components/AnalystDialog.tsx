import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import type React from "react";
import { useCallback, useState } from "react";
import { useArgueActions, useStore } from "@/store.js";

/** Name and email of the analyst, which exported graphs contain. */
export const AnalystFields: React.FC = () => {
  const analyst = useStore((state) => state.analyst);
  const { setState } = useArgueActions();

  return (
    <Stack spacing={2}>
      <TextField
        label="Your name"
        fullWidth
        value={analyst.name ?? ""}
        onChange={(event) => {
          const name = event.target.value;
          setState((state) => ({ analyst: { ...state.analyst, name } }));
        }}
      />
      <TextField
        label="Your email"
        type="email"
        fullWidth
        value={analyst.email ?? ""}
        onChange={(event) => {
          const email = event.target.value;
          setState((state) => ({ analyst: { ...state.analyst, email } }));
        }}
      />
    </Stack>
  );
};

/**
 * Run exports only once the analyst is known, asking for it before otherwise.
 * Returns the guard and the dialog that asks, which must be rendered.
 */
export function useAnalystGuard(): [guard: (action: () => void) => void, dialog: React.ReactNode] {
  const analyst = useStore((state) => state.analyst);
  const [pending, setPending] = useState<() => void>();
  const known = Boolean(analyst.name && analyst.email);
  const close = () => setPending(undefined);

  const guard = useCallback(
    (action: () => void) => (known ? action() : setPending(() => action)),
    [known],
  );

  const dialog = (
    <Dialog open={pending !== undefined} onClose={close}>
      <DialogTitle>Who created this graph?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Your name and email are saved in the exported file. You only need to enter them once.
        </DialogContentText>
        <AnalystFields />
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!known}
          onClick={() => {
            pending?.();
            close();
          }}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );

  return [guard, dialog];
}
