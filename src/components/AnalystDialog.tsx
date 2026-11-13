import { TextField } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog.js";
import { useArgueActions, useWorkspace } from "@/store.js";

/** Name and email of the analyst, which exported graphs contain. */
export const AnalystFields: React.FC = () => {
  const analyst = useWorkspace((state) => state.analyst);
  const { setWorkspace } = useArgueActions();

  return (
    <>
      <TextField
        label="Your name"
        value={analyst.name ?? ""}
        onChange={(event) => {
          const name = event.target.value;
          setWorkspace((state) => ({ analyst: { ...state.analyst, name } }));
        }}
      />
      <TextField
        label="Your email"
        type="email"
        value={analyst.email ?? ""}
        onChange={(event) => {
          const email = event.target.value;
          setWorkspace((state) => ({ analyst: { ...state.analyst, email } }));
        }}
      />
    </>
  );
};

/**
 * Run exports only once the analyst is known, asking for it before otherwise.
 * Returns the guard and the dialog that asks, which must be rendered.
 */
export function useAnalystGuard(): [guard: (action: () => void) => void, dialog: React.ReactNode] {
  const analyst = useWorkspace((state) => state.analyst);
  const [pending, setPending] = useState<() => void>();
  const known = Boolean(analyst.name && analyst.email);
  const close = () => setPending(undefined);

  const guard = (action: () => void) => (known ? action() : setPending(() => action));

  const dialog = (
    <ConfirmDialog
      open={pending !== undefined}
      title="Who created this graph?"
      description="Your name and email are saved in the exported file. You only need to enter them once."
      confirmText="Export"
      confirmDisabled={!known}
      onConfirm={() => pending?.()}
      onClose={close}
    >
      <AnalystFields />
    </ConfirmDialog>
  );

  return [guard, dialog];
}
