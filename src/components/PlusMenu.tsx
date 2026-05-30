import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton, Menu, useTheme } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { useArgueActions, useArgueConfig } from "../store.js";
import { canvasButtonSx } from "./canvasControls.js";
import { IconMenuItem } from "./IconMenuItem.js";

/** The add-node button (bottom-right of the canvas) and its atom/scheme menu. */
export const PlusMenu: React.FC = () => {
  const theme = useTheme();
  const { addAtomAt, addSchemeAt } = useArgueActions();
  const { readOnly } = useArgueConfig();
  const [plusButton, setPlusButton] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(plusButton);
  const close = () => {
    setPlusButton(null);
  };

  if (readOnly) {
    return null;
  }

  const buttonSx = {
    ...canvasButtonSx,
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
    "&:hover": { backgroundColor: theme.palette.primary.main },
  } as const;

  return (
    <>
      <IconButton
        aria-label="Add node"
        sx={buttonSx}
        onClick={(event) => {
          setPlusButton(event.currentTarget);
        }}
      >
        <FontAwesomeIcon icon={faPlus} fixedWidth />
      </IconButton>
      <Menu
        open={isOpen}
        onClose={close}
        anchorEl={plusButton}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <IconMenuItem
          icon={faPlus}
          text="Add Atom"
          onClick={() => {
            addAtomAt();
            close();
          }}
        />
        <IconMenuItem
          icon={faPlus}
          text="Add Scheme"
          onClick={() => {
            addSchemeAt();
            close();
          }}
        />
      </Menu>
    </>
  );
};

export default PlusMenu;
