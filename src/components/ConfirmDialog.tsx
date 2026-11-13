import { Button, DialogContentText } from "@mui/material";
import type React from "react";
import { BaseDialog, type BaseDialogProps } from "@/components/BaseDialog.js";

interface ConfirmDialogProps extends Omit<BaseDialogProps, "actions"> {
  description: string;
  /** Label of the confirming button. */
  confirmText: string;
  /** Mark the action as irreversible, which colors the confirming button. */
  destructive?: boolean;
  /** Disable the confirming button, e.g. until the fields given as children are filled. */
  confirmDisabled?: boolean;
  onConfirm: () => void;
}

/** Ask the user to confirm an action before running it, optionally with fields to fill. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  description,
  confirmText,
  destructive = false,
  confirmDisabled = false,
  onConfirm,
  onClose,
  children,
  ...props
}) => (
  <BaseDialog
    {...props}
    onClose={onClose}
    actions={
      <>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color={destructive ? "error" : "primary"}
          disabled={confirmDisabled}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </Button>
      </>
    }
  >
    <DialogContentText>{description}</DialogContentText>
    {children}
  </BaseDialog>
);
