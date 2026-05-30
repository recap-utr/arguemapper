import { faPlus, faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Box, IconButton, Menu, Stack, useTheme } from "@mui/material";
import type React from "react";
import { useArgueActions, useArgueConfig, useStore } from "../store.js";
import { IconMenuItem } from "./IconMenuItem.js";

export interface PlusMenuProps {
  plusButton: null | HTMLElement;
  setPlusButton: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
}

export const PlusMenu: React.FC<PlusMenuProps> = ({ plusButton, setPlusButton }) => {
  const theme = useTheme();
  const isOpen = Boolean(plusButton);
  const open = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPlusButton(event.currentTarget);
  };
  const close = () => {
    setPlusButton(null);
  };
  const { addAtomAt, addSchemeAt, toggleAssistantPanel } = useArgueActions();
  const { readOnly, assistant } = useArgueConfig();
  const busy = useStore((state) => state.assistantBusy);

  const buttonSx = { backgroundColor: theme.palette.primary.dark } as const;

  // Nothing to show: read-only viewer without the assistant.
  if (readOnly && !assistant) {
    return null;
  }

  return (
    <>
      <Box
        className="arguemapper-hidden"
        sx={{ position: "absolute", right: 10, bottom: 10, zIndex: 10 }}
      >
        <Stack spacing={1}>
          {assistant && (
            <Badge color="secondary" variant="dot" invisible={!busy} overlap="circular">
              <IconButton size="large" sx={buttonSx} onClick={() => toggleAssistantPanel()}>
                <FontAwesomeIcon icon={faRobot} />
              </IconButton>
            </Badge>
          )}
          {!readOnly && (
            <IconButton size="large" sx={buttonSx} onClick={open}>
              <FontAwesomeIcon icon={faPlus} />
            </IconButton>
          )}
        </Stack>
      </Box>
      <Menu
        open={isOpen}
        onClose={close}
        anchorEl={plusButton}
        sx={{ zIndex: 10, marginBottom: 10 }}
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
