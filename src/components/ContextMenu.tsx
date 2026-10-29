import { faCommentDots, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Menu } from "@mui/material";
import type React from "react";
import { useCallback, useMemo } from "react";
import * as model from "@/model.js";
import { useArgueActions, useStore } from "@/store.js";
import { IconMenuItem } from "@/components/IconMenuItem.js";

export interface Click {
  event?: MouseEvent | React.MouseEvent<Element, MouseEvent>;
  target?: model.CanvasElement;
  open: boolean;
}

export interface ContextMenuProps {
  click: Click;
  setClick: React.Dispatch<React.SetStateAction<Click>>;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ click, setClick }) => {
  const { addNodeAt, editGraph } = useArgueActions();
  const clickedType = useMemo(() => model.elementType(click.target), [click]);
  const targetId = click.target?.id;
  const screenPos =
    click.event === undefined ? undefined : { x: click.event.clientX, y: click.event.clientY };
  const majorClaim = useStore((state) => state.graph.majorClaim);

  const close = useCallback(() => {
    setClick((current) => ({ ...current, open: false }));
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
      anchorPosition={screenPos && { top: screenPos.y, left: screenPos.x }}
    >
      <IconMenuItem
        visible={showFor("atom")}
        icon={faCommentDots}
        text={majorClaim === targetId ? "Unset Major Claim" : "Set as Major Claim"}
        onClick={withClose(() => {
          if (targetId !== undefined) {
            editGraph((graph) => model.toggleMajorClaim(graph, targetId));
          }
        })}
      />
      <IconMenuItem
        visible={showFor(["atom", "scheme", "edge"])}
        icon={faTrash}
        text="Delete"
        onClick={withClose(() => {
          const ids = targetId === undefined ? [] : [targetId];

          editGraph((graph) => {
            model.removeElements(
              graph,
              clickedType === "edge" ? { nodes: [], edges: ids } : { nodes: ids, edges: [] },
            );
          });
        })}
      />
      <IconMenuItem
        visible={showFor("graph")}
        icon={faPlus}
        text="Add Atom"
        onClick={withClose(() => {
          addNodeAt(model.newAtom(), screenPos);
        })}
      />
      <IconMenuItem
        visible={showFor("graph")}
        icon={faPlus}
        text="Add Scheme"
        onClick={withClose(() => {
          addNodeAt(model.newScheme(), screenPos);
        })}
      />
    </Menu>
  );
};

export default ContextMenu;
