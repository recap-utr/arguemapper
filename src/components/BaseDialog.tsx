import { Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import type React from "react";

export interface BaseDialogProps extends React.PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Buttons at the bottom, the main one last. */
  actions: React.ReactNode;
}

/** Dialog with its content stacked, the base of all dialogs of the editor. */
export const BaseDialog: React.FC<BaseDialogProps> = ({
  open,
  title,
  onClose,
  actions,
  children,
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      {/* the padding keeps the label of a first text field from being cut off */}
      <Stack spacing={2} sx={{ pt: 1 }}>
        {children}
      </Stack>
    </DialogContent>
    <DialogActions>{actions}</DialogActions>
  </Dialog>
);
