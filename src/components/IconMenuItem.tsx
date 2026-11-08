import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import type React from "react";

interface Props {
  icon: SvgIconComponent;
  text: string;
  onClick: () => void;
}

/** A menu entry with a leading icon. */
export const IconMenuItem: React.FC<Props> = ({ icon: Icon, text, onClick }) => (
  <MenuItem onClick={onClick}>
    <ListItemIcon>
      <Icon />
    </ListItemIcon>
    <ListItemText>{text}</ListItemText>
  </MenuItem>
);
