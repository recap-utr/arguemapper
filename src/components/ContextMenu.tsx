import { faCommentDots, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Menu } from "@mui/material";
import { produce } from "immer";
import type React from "react";
import { useCallback, useMemo } from "react";
import * as model from "../model.js";
import { useArgueActions, useStore } from "../store.js";
import { IconMenuItem } from "./IconMenuItem.js";

export interface Click {
  event?: MouseEvent | React.MouseEvent<Element, MouseEvent>;
  target?: model.Element;
  open: boolean;
}

export interface ContextMenuProps {
  click: Click;
  setClick: React.Dispatch<React.SetStateAction<Click>>;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ click, setClick }) => {
  const { addAtomAt, addSchemeAt, mutate } = useArgueActions();
  const clickedType = useMemo(() => model.elemType(click.target), [click]);
  const majorClaim = useStore((state) => state.graph.majorClaim);

  const close = useCallback(() => {
    setClick(
      produce((draft) => {
        draft.open = false;
      }),
    );
  }, [setClick]);

  const showFor = useCallback(
    (type?: model.ElementType | model.ElementType[]) => {
      if (type === undefined) {
        return true;
      }
      if (Array.isArray(type)) {
        return type.includes(clickedType);
      }

      return type === clickedType;
    },
    [clickedType],
  );

  // Wrap a menu action so the menu always closes after it runs.
  const withClose = (action: () => void) => () => {
    action();
    close();
  };

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
      <IconMenuItem
        visible={showFor("atom")}
        icon={faCommentDots}
        text={
          showFor("atom") && majorClaim !== (click.target as model.AtomNode).id
            ? "Set as Major Claim"
            : "Unset Major Claim"
        }
        onClick={withClose(() => {
          const target = click.target as model.AtomNode;
          mutate((draft) => {
            draft.graph.majorClaim = majorClaim !== target.id ? target.id : undefined;
          });
        })}
      />
      <IconMenuItem
        visible={showFor(["atom", "scheme", "edge"])}
        icon={faTrash}
        text="Delete"
        onClick={withClose(() => {
          const target = click.target as model.Edge | model.AtomNode | model.SchemeNode;

          if ("source" in target && "target" in target) {
            mutate((draft) => {
              draft.edges = draft.edges.filter((edge) => target.id !== edge.id);
              draft.selection = model.initSelection();
            });
          } else {
            mutate((draft) => {
              draft.nodes = draft.nodes.filter((node) => target.id !== node.id);
              draft.selection = model.initSelection();
            });
          }
        })}
      />
      <IconMenuItem
        visible={showFor("graph")}
        icon={faPlus}
        text="Add Atom"
        onClick={withClose(() => {
          const screenPos =
            click.event !== undefined
              ? { x: click.event.clientX, y: click.event.clientY }
              : undefined;
          addAtomAt(screenPos);
        })}
      />
      <IconMenuItem
        visible={showFor("graph")}
        icon={faPlus}
        text="Add Scheme"
        onClick={withClose(() => {
          addSchemeAt();
        })}
      />
    </Menu>
  );
};

export default ContextMenu;
