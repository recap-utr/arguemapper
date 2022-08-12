import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faCommentDots,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import produce from "immer";
import React, { MouseEvent, useCallback, useMemo } from "react";
import { useViewport } from "react-flow-renderer";
import * as model from "../model";
import useStore, { State } from "../store";

interface ItemProps {
  callback: () => void;
  close: () => void;
  icon: IconProp;
  text: string;
  visible: boolean;
}

const Item: React.FC<ItemProps> = ({
  callback,
  close,
  icon,
  text,
  visible,
}) => {
  return (
    <MenuItem
      sx={{ display: visible ? "flex" : "none" }}
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

export interface Click {
  event?: MouseEvent;
  target?: model.AtomNode | model.SchemeNode | model.Edge;
  open: boolean;
}

export interface ContextMenuProps {
  click: Click;
  setClick: React.Dispatch<React.SetStateAction<Click>>;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ click, setClick }) => {
  const { x, y } = useViewport();
  const setState = useStore((state) => state.setState);
  const clickedType = useMemo(() => model.elemType(click.target), [click]);

  const close = useCallback(() => {
    setClick(
      produce((draft) => {
        draft.open = false;
      })
    );
  }, [setClick]);

  const showFor = useCallback(
    (type?: model.ElementType | model.ElementType[]) => {
      if (type === undefined) {
        return true;
      } else if (Array.isArray(type)) {
        return type.includes(clickedType);
      }

      return type === clickedType;
    },
    [clickedType]
  );

  return (
    <Menu
      className="arguemapper-hidden"
      sx={{ zIndex: 10 }}
      open={click.open}
      onClose={close}
      anchorReference="anchorPosition"
      anchorPosition={
        click.event
          ? {
              top: click.event.clientY,
              left: click.event.clientX,
            }
          : undefined
      }
    >
      <Item
        visible={showFor("atom")}
        callback={() => {
          const target = click.target as model.AtomNode;
          setState(
            produce((draft: State) => {
              draft.graph.majorClaim = target.id;
            })
          );
        }}
        close={close}
        icon={faCommentDots}
        text="Set as Major Claim"
      />
      <Item
        visible={showFor(["atom", "scheme", "edge"])}
        callback={() => {
          const target = click.target as
            | model.Edge
            | model.AtomNode
            | model.SchemeNode;

          if ("source" in target && "target" in target) {
            setState(
              produce((draft: State) => {
                draft.edges = draft.edges.filter(
                  (edge) => target.id !== edge.id
                );
              })
            );
          } else {
            setState(
              produce((draft: State) => {
                draft.nodes = draft.nodes.filter(
                  (node) => target.id !== node.id
                );
              })
            );
          }
        }}
        close={close}
        icon={faTrash}
        text="Delete"
      />
      <Item
        visible={showFor("graph")}
        callback={() => {
          const node = model.initAtom({ text: "", position: { x, y } });
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
        visible={showFor("graph")}
        callback={() => {
          const node = model.initScheme({ position: { x, y } });
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
    </Menu>
  );
};

export default ContextMenu;
