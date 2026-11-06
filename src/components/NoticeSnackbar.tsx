import { Alert, Snackbar } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { useStore } from "@/store.js";
import type { Notice } from "@/store/types.js";

/** Shows the current notice of the editor at the bottom of its area. */
export const NoticeSnackbar: React.FC = () => {
  const notice = useStore((state) => state.notice);

  // remounting reopens it for every new notice
  return notice && <NoticeView key={notice.key} notice={notice} />;
};

const NoticeView: React.FC<{ notice: Notice }> = ({ notice: { message, severity } }) => {
  const [open, setOpen] = useState(true);

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={(_event, reason) => reason !== "clickaway" && setOpen(false)}
      // within the editor instead of the viewport, so that each editor shows its own notices
      sx={{ position: "absolute" }}
    >
      <Alert severity={severity} variant="filled" onClose={() => setOpen(false)}>
        {message}
      </Alert>
    </Snackbar>
  );
};
