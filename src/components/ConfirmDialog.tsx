import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from "@mui/material";
import type React from "react";

interface ConfirmDialogProps extends React.PropsWithChildren {
  open: boolean;
  title: string;
  description: string;
  /** Label of the confirming button. */
  confirmText: string;
  /** Mark the action as irreversible, which colors the confirming button. */
  destructive?: boolean;
  /** Disable the confirming button, e.g. until the fields given as children are filled. */
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Ask the user to confirm an action before running it, optionally with fields to fill. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmText,
  destructive = false,
  confirmDisabled = false,
  onConfirm,
  onClose,
  children,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Stack spacing={2}>
        <DialogContentText>{description}</DialogContentText>
        {children}
      </Stack>
    </DialogContent>
    <DialogActions>
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
    </DialogActions>
  </Dialog>
);
