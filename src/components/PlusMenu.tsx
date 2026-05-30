import { faPlus, faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Badge,
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  useTheme,
} from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import type React from "react";
import * as model from "../model.js";
import { addNodeWithSelection, canvasCenter, toggleAssistantPanel, useStore } from "../store.js";

interface ItemProps {
  callback: () => void;
  close: () => void;
  text: string;
}

const Item: React.FC<ItemProps> = ({ callback, close, text }) => {
  return (
    <MenuItem
      onClick={() => {
        callback();
        close();
      }}
    >
      <ListItemIcon>
        <FontAwesomeIcon icon={faPlus} />
      </ListItemIcon>
      <ListItemText>{text}</ListItemText>
    </MenuItem>
  );
};

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
  const flow = useReactFlow();
  const busy = useStore((state) => state.assistantBusy);

  const buttonSx = { backgroundColor: theme.palette.primary.dark } as const;

  return (
    <>
      <Box
        className="arguemapper-hidden"
        sx={{ position: "absolute", right: 10, bottom: 10, zIndex: 10 }}
      >
        <Stack spacing={1}>
          <Badge color="secondary" variant="dot" invisible={!busy} overlap="circular">
            <IconButton size="large" sx={buttonSx} onClick={() => toggleAssistantPanel()}>
              <FontAwesomeIcon icon={faRobot} />
            </IconButton>
          </Badge>
          <IconButton size="large" sx={buttonSx} onClick={open}>
            <FontAwesomeIcon icon={faPlus} />
          </IconButton>
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
        <Item
          callback={() => {
            const { x, y } = flow.screenToFlowPosition(canvasCenter());
            const node = model.initAtom({ data: { text: "" }, position: { x, y } });
            addNodeWithSelection(node);
          }}
          close={close}
          text="Add Atom"
        />
        <Item
          callback={() => {
            const { x, y } = flow.screenToFlowPosition(canvasCenter());
            const node = model.initScheme({ data: {}, position: { x, y } });
            addNodeWithSelection(node);
          }}
          close={close}
          text="Add Scheme"
        />
      </Menu>
    </>
  );
};
