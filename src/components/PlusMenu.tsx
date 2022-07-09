import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  useTheme,
} from "@mui/material";
import produce from "immer";
import React from "react";
import { useViewport } from "react-flow-renderer";
import * as model from "../model";
import { useGraph } from "./GraphContext";

interface ItemProps {
  callback: () => void;
  close: () => void;
  icon: IconProp;
  text: string;
}

const Item: React.FC<ItemProps> = ({ callback, close, icon, text }) => {
  return (
    <MenuItem
      onClick={() => {
        callback();
        close();
      }}
    >
      <ListItemIcon>
        <FontAwesomeIcon icon={icon} />
      </ListItemIcon>
      <ListItemText>{text}</ListItemText>
    </MenuItem>
  );
};

export interface PlusMenuProps {
  plusButton: null | HTMLElement;
  setPlusButton: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
}

const PlusMenu: React.FC<PlusMenuProps> = ({ plusButton, setPlusButton }) => {
  const theme = useTheme();
  const { setGraph, saveState } = useGraph();
  const isOpen = Boolean(plusButton);
  const open = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPlusButton(event.currentTarget);
  };
  const close = () => {
    setPlusButton(null);
  };
  const { x, y } = useViewport();

  return (
    <>
      <Box position="absolute" right={10} bottom={10} zIndex={10}>
        <IconButton
          size="large"
          sx={{ backgroundColor: theme.palette.primary.dark }}
          onClick={open}
        >
          <FontAwesomeIcon icon={faPlus} />
        </IconButton>
      </Box>
      <Menu
        open={isOpen}
        onClose={close}
        anchorEl={plusButton}
        sx={{ zIndex: 10, marginBottom: 10 }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Item
          callback={() => {
            const node = model.initAtom({ text: "", position: { x, y } });
            node.selected = true;

            setGraph(
              produce((draft) => {
                draft.nodes.push(node);
              })
            );

            saveState();
          }}
          close={close}
          icon={faPlus}
          text="Add Atom"
        />
        <Item
          callback={() => {
            const node = model.initScheme({ position: { x, y } });
            node.selected = true;

            setGraph(
              produce((draft) => {
                draft.nodes.push(node);
              })
            );

            saveState();
          }}
          close={close}
          icon={faPlus}
          text="Add Scheme"
        />
      </Menu>
    </>
  );
};

export default PlusMenu;
