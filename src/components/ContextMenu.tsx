import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faCommentDots,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { produce } from "immer";
import React, { MouseEvent, useCallback, useMemo } from "react";
import { useReactFlow } from "reactflow";
import * as model from "../model.js";
import { canvasCenter, setState, State, useStore } from "../store.js";

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
  target?: model.Element;
  open: boolean;
}

export interface ContextMenuProps {
  click: Click;
  setClick: React.Dispatch<React.SetStateAction<Click>>;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  click,
  setClick,
}) => {
  const flow = useReactFlow();
  const leftSidebarOpen = useStore((state) => state.leftSidebarOpen);
  const headerHeight = useStore((state) => state.headerHeight);
  const sidebarWidth = useStore((state) => state.sidebarWidth);
  const clickedType = useMemo(() => model.elemType(click.target), [click]);
  const majorClaim = useStore((state) => state.graph.majorClaim);

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
              draft.graph.majorClaim =
                majorClaim !== target.id ? target.id : undefined;
            })
          );
        }}
        close={close}
        icon={faCommentDots}
        text={
          showFor("atom") && majorClaim !== (click.target as model.AtomNode).id
            ? "Set as Major Claim"
            : "Unset Major Claim"
        }
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
                draft.selection = model.initSelection();
              })
            );
          } else {
            setState(
              produce((draft: State) => {
                draft.nodes = draft.nodes.filter(
                  (node) => target.id !== node.id
                );
                draft.selection = model.initSelection();
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
          const { x, y } = flow.project(
            click.event !== undefined
              ? {
                  x: click.event.clientX - (leftSidebarOpen ? sidebarWidth : 0),
                  y: click.event.clientY - headerHeight,
                }
              : canvasCenter()
          );
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
        visible={showFor("graph")}
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
    </Menu>
  );
};

export default ContextMenu;
