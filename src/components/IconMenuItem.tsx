import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import type React from "react";

interface Props {
  icon: IconProp;
  text: string;
  onClick: () => void;
  visible?: boolean;
}

/** A menu entry with a leading FontAwesome icon, shared by the context and plus menus. */
export const IconMenuItem: React.FC<Props> = ({ icon, text, onClick, visible = true }) => (
  <MenuItem sx={visible ? undefined : { display: "none" }} onClick={onClick}>
    <ListItemIcon>
      <FontAwesomeIcon icon={icon} />
    </ListItemIcon>
    <ListItemText>{text}</ListItemText>
  </MenuItem>
);
