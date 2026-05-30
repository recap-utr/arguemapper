import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type React from "react";

interface Props extends React.PropsWithChildren {
  title: string;
  /** Hides this pane only. */
  onClose: () => void;
}

/** Compact header for a stacked sidebar pane: title, optional actions, and a hide-pane button. */
export const SectionHeader: React.FC<Props> = ({ title, onClose, children }) => (
  <Stack
    direction="row"
    sx={{
      alignItems: "center",
      gap: 0.5,
      pl: 2,
      pr: 0.5,
      minHeight: 40,
      borderBottom: 1,
      borderColor: "divider",
      flexShrink: 0,
    }}
  >
    <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1 }}>
      {title}
    </Typography>
    {children}
    <Tooltip describeChild title="Hide pane">
      <IconButton size="small" onClick={onClose}>
        <FontAwesomeIcon icon={faXmark} />
      </IconButton>
    </Tooltip>
  </Stack>
);
