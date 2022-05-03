import {
  faCircle,
  faCommentDots,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faPlus,
  faRedo,
  faSitemap,
  faTrash,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popper,
  Stack,
  Tooltip,
  useTheme,
} from "@mui/material";
import type { Core, EventObject, NodeSingular } from "cytoscape";
import cytoscape from "cytoscape";
import edgehandles, { EdgeHandlesInstance } from "cytoscape-edgehandles";
import elk, { ElkLayoutOptions } from "cytoscape-elk";
import navigator from "cytoscape-navigator";
import cytoPopper from "cytoscape-popper";
import { useSnackbar } from "notistack";
import React, { useCallback, useEffect, useState } from "react";
import useKeyboardJs from "react-use/lib/useKeyboardJs";
import style from "../cytoStyle";
import * as cytoModel from "../model/cytoWrapper";
import { useGraph } from "./GraphContext";

cytoscape.use(elk);
cytoscape.use(edgehandles);
cytoscape.use(cytoPopper);
cytoscape.use(navigator);
// Otherwise, react will throw errors when hot-reloading the module
// @ts-ignore
cytoscape.use = () => {};

const defaultLayout: ElkLayoutOptions = {
  name: "elk",
  nodeDimensionsIncludeLabels: true,
  animate: false,
  elk: {
    // algorithm: "mrtree",
    algorithm: "layered",
    "elk.direction": "UP",
    "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
    "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
  },
};

function initEdgeHandles(
  cy: Core,
  updateGraph: () => void,
  setEhStart: (element: any) => void
) {
  const eh = cy.edgehandles({
    hoverDelay: 0,
    // edgeType: function (_source, edge) {
    //   // if (edge.source().edgesTo(edge.target()).length() > 1) {
    //   //   return null;
    //   // }
    //   return 'flat';
    // },
  });

  // https://github.com/cytoscape/cytoscape.js-edgehandles/blob/3906ce5e43740e2cc0fa8e44ff41ba8befca6b74/demo.html#L186
  cy.on("mouseover tap free", "node", (e) => {
    setEhStart(e.target);
  });

  cy.on("grab mouseout", "node", () => {
    setEhStart(null);
  });

  cy.on("tap", (e) => {
    if (e.target === cy) {
      setEhStart(null);
    }
  });

  cy.on("viewport add remove move", () => {
    setEhStart(null);
  });

  // @ts-ignore
  cy.on("ehcomplete", (event, sourceNode, targetNode, addedEdge) => {
    const sourceData = sourceNode.data() as cytoModel.node.Node;
    const targetData = targetNode.data() as cytoModel.node.Node;
    addedEdge.remove();

    if (
      cytoModel.node.isAtom(sourceData) &&
      cytoModel.node.isAtom(targetData)
    ) {
      const sourcePos = sourceNode.position();
      const targetPos = targetNode.position();

      const position = {
        x: (sourcePos.x + targetPos.x) / 2,
        y: (sourcePos.y + targetPos.y) / 2,
      };

      const schemeData = cytoModel.node.initScheme({});

      cy.add({
        nodes: [{ data: schemeData, position }],
        edges: [
          {
            data: cytoModel.edge.init({
              source: sourceData.id,
              target: schemeData.id,
            }),
          },
          {
            data: cytoModel.edge.init({
              source: schemeData.id,
              target: targetData.id,
            }),
          },
        ],
      });
    } else {
      // @ts-ignore
      cy.add({
        // @ts-ignore
        edges: [
          {
            data: cytoModel.edge.init({
              source: sourceData.id,
              target: targetData.id,
            }),
          },
        ],
      });
    }

    eh.disableDrawMode();
    updateGraph();
  });

  return eh;
}

type ElementType = null | "atom" | "scheme" | "edge" | "graph";

interface CtxMenuProps {
  mouseX: null | number;
  mouseY: null | number;
  cytoX: null | number;
  cytoY: null | number;
  target: null | any;
  type: ElementType;
}

const initialCtxMenu: CtxMenuProps = {
  mouseX: null,
  mouseY: null,
  cytoX: null,
  cytoY: null,
  target: null,
  type: null,
};

export default function Cytoscape({
  container,
  containerRef,
  containerSize,
}: {
  container: HTMLElement | null;
  containerRef: (node: HTMLElement | null) => void;
  containerSize: () => { width: number; height: number };
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [ctxMenu, setCtxMenu] = useState<CtxMenuProps>(initialCtxMenu);
  const [eh, setEh] = useState<EdgeHandlesInstance | null>(null);
  const [ehStart, setEhStart] = useState<any>(null);
  const [zoom, setZoom] = useState<number>(1);
  const theme = useTheme();
  const [undoPressed] = useKeyboardJs("mod + z");
  const [redoPressed] = useKeyboardJs("mod + shift + z");
  const [plusButton, setPlusButton] = React.useState<null | HTMLElement>(null);
  const plusMenuOpen = Boolean(plusButton);
  const openPlusMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPlusButton(event.currentTarget);
  };
  const closePlusMenu = () => {
    setPlusButton(null);
  };
  const {
    cy,
    _setCy,
    _setCyRef,
    loadGraph,
    resetGraph,
    updateGraph,
    undo,
    redo,
    undoable,
    redoable,
    resetStates,
  } = useGraph();

  useEffect(() => {
    if (undoPressed && undoable) {
      undo();
    }
  }, [undo, undoPressed, undoable]);

  useEffect(() => {
    if (redoPressed && redoable) {
      redo();
    }
  }, [redo, redoPressed, redoable]);

  const layout = useCallback(() => {
    if (cy) {
      cy.layout(defaultLayout).run();
      updateGraph();
    }
  }, [cy, updateGraph]);

  const openContextMenu = useCallback((event: EventObject) => {
    const data = event.target.data();

    setCtxMenu({
      mouseX: event.originalEvent.clientX,
      mouseY: event.originalEvent.clientY,
      cytoX: event.position.x,
      cytoY: event.position.y,
      target: event.target,
      type: data.type
        ? data.type
        : data.source && data.target
        ? "edge"
        : "graph",
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setCtxMenu((menu) => ({ ...initialCtxMenu, type: menu.type }));
  }, []);

  const showFor = useCallback(
    (kind: ElementType | ElementType[] | null) => {
      if (kind === null) {
        return { sx: { display: "flex" } };
      } else if (Array.isArray(kind)) {
        return {
          sx: { display: kind.includes(ctxMenu.type) ? "flex" : "none" },
        };
      }

      return {
        sx: { display: kind === ctxMenu.type ? "flex" : "none" },
      };
    },
    [ctxMenu.type]
  );

  const initCy = useCallback(() => {
    if (container !== null) {
      const _cy = cytoscape({
        container: container,
        ...loadGraph(),
        layout: { name: "preset" },
        // @ts-ignore
        style: style(theme),
        boxSelectionEnabled: true,
        autounselectify: false,
        selectionType: "single",
        minZoom: 0.1,
        maxZoom: 3.0,
      });
      _setCy(_cy);
      _setCyRef(_cy);

      _cy.elements().selectify();
      _cy.elements().unselect();
      setEh(initEdgeHandles(_cy, updateGraph, setEhStart));
      _cy.on("cxttap", openContextMenu);
      _cy.on("dragfree", "node[metadata]", () => {
        updateGraph();
      });
      _cy.on("zoom", () => {
        setZoom(_cy.zoom());
      });

      // // @ts-ignore
      // _cy.navigator({
      //   // container: "#navigatorContainer",
      //   //   viewLiveFramerate: 0, // set false to update graph pan only on drag end; set 0 to do it instantly; set a number (frames per second) to update not more than N times per second
      //   //   thumbnailEventFramerate: 30, // max thumbnail's updates per second triggered by graph updates
      //   //   thumbnailLiveFramerate: false, // max thumbnail's updates per second. Set false to disable
      //   //   dblClickDelay: 200, // milliseconds
      //   // removeCustomContainer: false, // destroy the container specified by user on plugin destroy
      //   // rerenderDelay: 0, // ms to throttle rerender updates to the panzoom for performance
      // });

      if (
        _cy.nodes("[metadata]").every((node) => {
          const pos = (node as NodeSingular).position();
          return pos.x === 0 && pos.y === 0;
        })
      ) {
        _cy.layout(defaultLayout).run();
      }

      updateGraph();
      resetStates();
      setZoom(_cy.zoom());

      return () => _cy.destroy();
    }
  }, [
    updateGraph,
    resetStates,
    theme,
    loadGraph,
    _setCy,
    _setCyRef,
    openContextMenu,
    container,
  ]);

  useEffect(() => {
    try {
      initCy();
    } catch {
      resetGraph(cytoModel.init({}));
      initCy();
      enqueueSnackbar(
        "There was an error loading your stored graph. We have created an empty graph for you.",
        { variant: "error", key: "graph_initcy_error" }
      );
    }
  }, [initCy, resetGraph, enqueueSnackbar]);

  useEffect(() => {
    if (eh) {
      window.addEventListener("mouseup", () => eh.stop());
    }
  }, [eh]);

  return (
    <Box>
      <Box
        ref={containerRef}
        sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* <Box
        id="navigatorContainer"
        sx={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 200,
          height: 200,
        }}
      /> */}
      <Box sx={{ position: "absolute", left: 0, bottom: 0 }}>
        <Stack direction="column">
          <Tooltip
            describeChild
            title="Automatically layout graph elements"
            placement="right"
          >
            <IconButton onClick={layout}>
              <FontAwesomeIcon icon={faSitemap} />
            </IconButton>
          </Tooltip>
          <Tooltip describeChild title="Undo last action" placement="right">
            <span>
              <IconButton disabled={!undoable} onClick={undo}>
                <FontAwesomeIcon icon={faUndo} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip describeChild title="Redo last action" placement="right">
            <span>
              <IconButton disabled={!redoable} onClick={redo}>
                <FontAwesomeIcon icon={faRedo} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip describeChild title="Zoom in" placement="right">
            <span>
              <IconButton
                disabled={zoom === cy?.maxZoom()}
                onClick={() => {
                  cy?.zoom(zoom * 1.2);
                }}
              >
                <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip describeChild title="Zoom out" placement="right">
            <span>
              <IconButton
                disabled={zoom === cy?.minZoom()}
                onClick={() => {
                  cy?.zoom(zoom * 0.8);
                }}
              >
                <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>
      <Box sx={{ position: "absolute", right: 10, bottom: 10 }}>
        <IconButton
          size="large"
          sx={{ backgroundColor: theme.palette.primary.dark }}
          onClick={openPlusMenu}
        >
          <FontAwesomeIcon icon={faPlus} />
        </IconButton>
      </Box>
      <Menu
        open={plusMenuOpen}
        onClose={closePlusMenu}
        anchorEl={plusButton}
        sx={{ marginBottom: 10 }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={() => {
            const newElem = cytoModel.node.initAtom({ text: "" });
            const size = containerSize();
            // @ts-ignore
            cy?.add({
              // @ts-ignore
              nodes: [
                {
                  data: newElem,
                  renderedPosition: {
                    x: size.width / 2,
                    y: size.height / 2,
                  },
                },
              ],
            });
            updateGraph();
            cy?.$id(newElem.id).select();
            closePlusMenu();
          }}
        >
          <ListItemIcon>
            <FontAwesomeIcon icon={faPlus} />
          </ListItemIcon>
          <ListItemText>Add Atom</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const newElem = cytoModel.node.initScheme({});
            const size = containerSize();
            // @ts-ignore
            cy?.add({
              // @ts-ignore
              nodes: [
                {
                  data: newElem,
                  renderedPosition: {
                    x: size.width / 2,
                    y: size.height / 2,
                  },
                },
              ],
            });
            updateGraph();
            cy?.$id(newElem.id).select();
            closePlusMenu();
          }}
        >
          <ListItemIcon>
            <FontAwesomeIcon icon={faPlus} />
          </ListItemIcon>
          <ListItemText>Add Scheme</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            eh?.enableDrawMode();
            closePlusMenu();
          }}
        >
          <ListItemIcon>
            <FontAwesomeIcon icon={faPlus} />
          </ListItemIcon>
          <ListItemText>Add Edge</ListItemText>
        </MenuItem>
      </Menu>
      <Menu
        open={ctxMenu.mouseY !== null && ctxMenu.mouseX !== null}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          ctxMenu.mouseY !== null && ctxMenu.mouseX !== null
            ? { top: ctxMenu.mouseY, left: ctxMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          {...showFor(["atom"])}
          onClick={() => {
            if (cy && ctxMenu.target) {
              const nodeId = ctxMenu.target.id();

              if (nodeId) {
                cy.data("majorClaim", nodeId);

                updateGraph();
              }
            }
            closeContextMenu();
          }}
        >
          <ListItemIcon>
            <FontAwesomeIcon icon={faCommentDots} />
          </ListItemIcon>
          <ListItemText>Set as Major Claim</ListItemText>
        </MenuItem>
        <MenuItem
          {...showFor(["atom", "scheme", "edge"])}
          onClick={() => {
            ctxMenu.target?.remove();
            updateGraph();
            closeContextMenu();
          }}
        >
          <ListItemIcon>
            <FontAwesomeIcon icon={faTrash} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        <MenuItem
          {...showFor(["graph"])}
          onClick={() => {
            const newElem = cytoModel.node.initAtom({ text: "" });
            // @ts-ignore
            cy?.add({
              // @ts-ignore
              nodes: [
                {
                  data: newElem,
                  position: {
                    x: ctxMenu.cytoX,
                    y: ctxMenu.cytoY,
                  },
                },
              ],
            });
            updateGraph();
            cy?.$id(newElem.id).select();
            closeContextMenu();
          }}
        >
          <ListItemIcon>
            <FontAwesomeIcon icon={faPlus} />
          </ListItemIcon>
          <ListItemText>Add Atom</ListItemText>
        </MenuItem>
        <MenuItem
          {...showFor(["graph"])}
          onClick={() => {
            const newElem = cytoModel.node.initScheme({});
            // @ts-ignore
            cy?.add({
              // @ts-ignore
              nodes: [
                {
                  data: newElem,
                  position: {
                    x: ctxMenu.cytoX,
                    y: ctxMenu.cytoY,
                  },
                },
              ],
            });
            updateGraph();
            cy?.$id(newElem.id).select();
            closeContextMenu();
          }}
        >
          <ListItemIcon>
            <FontAwesomeIcon icon={faPlus} />
          </ListItemIcon>
          <ListItemText>Add Scheme</ListItemText>
        </MenuItem>
      </Menu>
      {
        // @ts-ignore
        <Popper
          onMouseDown={useCallback(() => {
            if (ehStart && eh) {
              eh.start(ehStart);
            }
          }, [eh, ehStart])}
          open={Boolean(ehStart) && zoom > 0.7}
          anchorEl={{
            getBoundingClientRect: ehStart
              ? ehStart.popperRef().getBoundingClientRect
              : null,
          }}
          placement="top"
          modifiers={[{ name: "offset", options: { offset: [0, 0] } }]}
        >
          <IconButton sx={{ fontSize: 10 * zoom }} color="warning">
            <FontAwesomeIcon icon={faCircle} />
          </IconButton>
        </Popper>
      }
    </Box>
  );
}
