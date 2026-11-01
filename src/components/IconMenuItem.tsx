import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import type React from "react";

interface Props {
  icon: IconProp;
  text: string;
  onClick: () => void;
}

/** A menu entry with a leading FontAwesome icon. */
export const IconMenuItem: React.FC<Props> = ({ icon, text, onClick }) => (
  <MenuItem onClick={onClick}>
    <ListItemIcon>
      <FontAwesomeIcon icon={icon} fixedWidth />
    </ListItemIcon>
    <ListItemText>{text}</ListItemText>
  </MenuItem>
);
