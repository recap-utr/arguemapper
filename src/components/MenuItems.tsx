import type { SvgIconComponent } from "@mui/icons-material";
import CheckIcon from "@mui/icons-material/Check";
import { ListItemIcon, ListItemText, ListSubheader, MenuItem } from "@mui/material";
import type React from "react";
import { createContext, useContext } from "react";

/** Closes the menu that the entry is on, e.g. once its action is chosen. */
export const MenuCloseContext: React.Context<() => void> = createContext(() => {});

export const useMenuClose = (): (() => void) => useContext(MenuCloseContext);

interface IconMenuItemProps {
  icon: SvgIconComponent;
  text: string;
  onClick: () => void;
}

/** A menu entry with a leading icon that runs its action and closes the menu. */
export const IconMenuItem: React.FC<IconMenuItemProps> = ({ icon: Icon, text, onClick }) => {
  const close = useMenuClose();

  return (
    <MenuItem
      onClick={() => {
        onClick();
        close();
      }}
    >
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText>{text}</ListItemText>
    </MenuItem>
  );
};

interface CheckMenuItemProps {
  text: string;
  checked: boolean;
  /** A radio entry is one of several options, a checkbox entry toggles on its own. */
  kind: "radio" | "checkbox";
  onClick: () => void;
}

/** A menu entry with a check mark in front of it while it is checked, the menu stays open. */
export const CheckMenuItem: React.FC<CheckMenuItemProps> = ({ text, checked, kind, onClick }) => (
  <MenuItem role={`menuitem${kind}`} aria-checked={checked} onClick={onClick}>
    <ListItemIcon>{checked && <CheckIcon />}</ListItemIcon>
    <ListItemText>{text}</ListItemText>
  </MenuItem>
);

/** Heading of a group of menu entries. */
export const MenuSubheader: React.FC<React.PropsWithChildren> = ({ children }) => (
  // sticky headers take on the elevation tint of the menu they are on
  <ListSubheader sx={{ backgroundImage: "var(--Paper-overlay)" }}>{children}</ListSubheader>
);
