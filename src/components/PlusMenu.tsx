import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faBolt,
  faComments,
  faDiagramProject,
  faPlus,
  faStar,
  faTimeline,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  useTheme,
} from "@mui/material";
import { produce } from "immer";
import { useSnackbar } from "notistack";
import React, { useCallback } from "react";
import { useReactFlow } from "reactflow";
import * as model from "../model.js";
import {
  extractAdus,
  identifyMajorClaim,
  predictRelations,
} from "../services/openai.js";
import { State, canvasCenter, setState } from "../store.js";

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

export const PlusMenu: React.FC<PlusMenuProps> = ({
  plusButton,
  setPlusButton,
}) => {
  const theme = useTheme();
  const isOpen = Boolean(plusButton);
  const open = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPlusButton(event.currentTarget);
  };
  const close = () => {
    setPlusButton(null);
  };
  const flow = useReactFlow();
  const setIsLoading = useCallback((value: boolean) => {
    setState({ isLoading: value });
  }, []);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const handleError = useCallback(
    (e: unknown) => {
      let errorMsg = "Unknown error";
      if (typeof e === "string") {
        errorMsg = e.toUpperCase();
      } else if (e instanceof Error) {
        errorMsg = e.message;
      }
      console.log(errorMsg);

      enqueueSnackbar(errorMsg, {
        variant: "error",
        autoHideDuration: 5000,
        action: (key) => (
          <IconButton
            onClick={() => {
              closeSnackbar(key);
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </IconButton>
        ),
      });
    },
    [closeSnackbar, enqueueSnackbar]
  );

  return (
    <>
      <Box
        className="arguemapper-hidden"
        position="absolute"
        right={10}
        bottom={10}
        zIndex={10}
      >
        <IconButton
          size="large"
          sx={{ backgroundColor: theme.palette.primary.dark }}
          onClick={open}
        >
          <FontAwesomeIcon icon={faBolt} />
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
            const { x, y } = flow.project(canvasCenter());
            const node = model.initAtom({
              data: { text: "" },
              position: { x, y },
            });
            node.selected = true;

            setState(
              produce((draft: State) => {
                draft.nodes.push(node);
              })
            );
          }}
          close={close}
          icon={faPlus}
          text="Add Atom"
        />
        <Item
          callback={() => {
            const { x, y } = flow.project(canvasCenter());
            const node = model.initScheme({ data: {}, position: { x, y } });
            node.selected = true;

            setState(
              produce((draft: State) => {
                draft.nodes.push(node);
              })
            );
          }}
          close={close}
          icon={faPlus}
          text="Add Scheme"
        />
        <Divider />
        <Item
          callback={() => {
            setIsLoading(true);
            // generateGraph().catch(handleError).finally(() => setIsLoading(false));
          }}
          close={close}
          icon={faTimeline}
          text="Generate Complete Graph"
        />
        <Divider />
        <Item
          callback={() => {
            setIsLoading(true);
            extractAdus()
              .catch(handleError)
              .finally(() => setIsLoading(false));
          }}
          close={close}
          icon={faComments}
          text="Extract ADUs"
        />
        <Item
          callback={() => {
            setIsLoading(true);
            identifyMajorClaim()
              .catch(handleError)
              .finally(() => setIsLoading(false));
          }}
          close={close}
          icon={faStar}
          text="Identify Major Claim"
        />
        <Item
          callback={() => {
            setIsLoading(true);
            predictRelations()
              .catch(handleError)
              .finally(() => setIsLoading(false));
          }}
          close={close}
          icon={faDiagramProject}
          text="Predict Relations"
        />
      </Menu>
    </>
  );
};
