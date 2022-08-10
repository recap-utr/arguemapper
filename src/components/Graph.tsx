import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, IconButton, Stack } from "@mui/material";
import * as color from "@mui/material/colors";
import produce from "immer";
import { useSnackbar } from "notistack";
import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  OnConnect,
  OnEdgesChange,
  OnInit,
  OnNodesChange,
  OnNodesDelete,
  OnSelectionChangeFunc,
  useReactFlow,
} from "react-flow-renderer";
import useKeyboardJs from "react-use/lib/useKeyboardJs";
import * as model from "../model";
import generateDemo from "../services/demo";
import layout from "../services/layout";
import useStore, { State } from "../store";
import ContextMenu, { Click as ContextMenuClick } from "./ContextMenu";
import EdgeTypes from "./EdgeTypes";
import MarkerDefinition from "./Marker";
import NodeTypes from "./NodeTypes";
import PlusMenu from "./PlusMenu";
import Toolbar from "./Toolbar";

export default function Graph() {
  const [ctxMenu, setCtxMenu] = useState<ContextMenuClick>({ open: false });
  const [undoPressed] = useKeyboardJs("mod + z");
  const [redoPressed] = useKeyboardJs("mod + shift + z");
  const [plusButton, setPlusButton] = React.useState<null | HTMLElement>(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const flow = useReactFlow();

  const [undo, redo, resetUndoRedo] = useStore((state) => [
    state.undo,
    state.redo,
    state.resetUndoRedo,
  ]);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const setState = useStore((state) => state.setState);
  const resetState = useStore((state) => state.resetState);
  const [firstVisit, disableFirstVisit] = useStore((state) => [
    state.firstVisit,
    state.disableFirstVisit,
  ]);
  const [shouldLayout, setShouldLayout] = useStore((state) => [
    state.shouldLayout,
    state.setShouldLayout,
  ]);
  const [shouldFit, setShouldFit] = useState(false);

  useEffect(() => {
    if (firstVisit) {
      enqueueSnackbar(
        "Hi there! If you are using this app for the first time, you may want to load our demo.",
        {
          key: "welcome",
          persist: true,
          variant: "info",
          action: (key) => (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                disableElevation
                variant="contained"
                onClick={() => {
                  resetState(generateDemo());
                  closeSnackbar(key);
                  disableFirstVisit();
                }}
              >
                Load Demo
              </Button>
              <IconButton
                onClick={() => {
                  closeSnackbar(key);
                  disableFirstVisit();
                }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </IconButton>
            </Stack>
          ),
        }
      );
    }
  }, [
    resetState,
    closeSnackbar,
    enqueueSnackbar,
    firstVisit,
    disableFirstVisit,
    flow,
  ]);

  useEffect(() => {
    if (shouldFit) {
      flow.fitView();
      setShouldFit(false);
    }
  }, [shouldFit, setShouldFit, flow]);

  const nodeHasDimension = (el: model.Node) => el.width && el.height;

  useEffect(() => {
    if (
      shouldLayout &&
      nodes.length &&
      nodes.length > 0 &&
      nodes.every(nodeHasDimension)
    ) {
      layout(nodes, edges).then((layoutedNodes) => {
        setState(
          produce((draft: State) => {
            draft.nodes = layoutedNodes;
          })
        );
        resetUndoRedo();
        setShouldLayout(false);
        setShouldFit(true);
      });
    }
  }, [
    setShouldFit,
    shouldLayout,
    edges,
    setShouldLayout,
    nodes,
    setState,
    resetUndoRedo,
  ]);

  useEffect(() => {
    if (undoPressed && undo !== undefined) {
      undo();
    }
  }, [undo, undoPressed]);

  useEffect(() => {
    if (redoPressed && redo !== undefined) {
      redo();
    }
  }, [redo, redoPressed]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setState(
        produce((draft: State) => {
          draft.nodes = applyNodeChanges(changes, draft.nodes);
        })
      );
    },
    [setState]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setState(
        produce((draft: State) => {
          draft.edges = applyEdgeChanges(changes, draft.edges);
        })
      );
    },
    [setState]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      const source = nodes.find((node) => node.id === connection.source);
      const target = nodes.find((node) => node.id === connection.target);

      if (source && target && model.isAtom(source) && model.isAtom(target)) {
        const schemePos = {
          x: (source.position.x + target.position.x) / 2,
          y: (source.position.y + target.position.y) / 2,
        };
        const scheme = model.initScheme({ position: schemePos });

        setState(
          produce((draft: State) => {
            draft.nodes.push(scheme);
            draft.edges.push(
              model.initEdge({ source: source.id, target: scheme.id })
            );
            draft.edges.push(
              model.initEdge({ source: scheme.id, target: target.id })
            );
          })
        );
      } else {
        setState(
          produce((draft: State) => {
            draft.edges = addEdge(connection, draft.edges);
          })
        );
      }
    },
    [setState, nodes]
  );

  const onNodesDelete: OnNodesDelete = useCallback(
    (deletedNodes) => {
      const deletedNodeIds = deletedNodes.map((node) => node.id);
      setState(
        produce((draft: State) => {
          draft.nodes = draft.nodes.filter(
            (node) => !deletedNodeIds.includes(node.id)
          );
        })
      );
    },
    [setState]
  );

  const onInit: OnInit = useCallback(
    (instance) => {
      instance.fitView();

      if (resetUndoRedo !== undefined) {
        resetUndoRedo();
      }
    },
    [resetUndoRedo]
  );

  const onContextMenu = (
    event: React.MouseEvent,
    target?: model.AtomNode | model.SchemeNode | model.Edge
  ) => {
    setCtxMenu({
      event,
      target,
      open: true,
    });
  };

  const onSelectionChange: OnSelectionChangeFunc = (elems) =>
    setState(
      produce((draft: State) => {
        const partialSelection = {
          nodes: elems.nodes.map((selectedNode) =>
            draft.nodes.findIndex((node) => node.id === selectedNode.id)
          ),
          edges: elems.edges.map((selectedEdge) =>
            draft.edges.findIndex((edge) => edge.id === selectedEdge.id)
          ),
        };

        const nodeTypes = elems.nodes.map(
          (node) => node.type as "scheme" | "atom"
        );

        draft.selection = {
          ...partialSelection,
          type: model.selectionType(partialSelection, nodeTypes),
        };
      })
    );

  return (
    <ReactFlow
      id="react-flow"
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={onInit}
      onNodeContextMenu={onContextMenu}
      onEdgeContextMenu={onContextMenu}
      onPaneContextMenu={onContextMenu}
      onNodesDelete={onNodesDelete}
      onSelectionChange={onSelectionChange}
      selectNodesOnDrag={true}
      nodeTypes={NodeTypes}
      edgeTypes={EdgeTypes}
      minZoom={0.01}
      maxZoom={3}
      attributionPosition="bottom-center"
    >
      {/* <MiniMap
        // style={}
        nodeStrokeColor=""
        nodeColor={() => {
          return "#333";
        }}
        nodeBorderRadius={0}
        maskColor="#eee"
      /> */}
      {/* <Controls/> */}
      <MarkerDefinition
        id="arguemapper-marker"
        color={color.grey[500]}
        strokeWidth={2.5}
      />
      <Toolbar />
      <ContextMenu click={ctxMenu} setClick={setCtxMenu} />
      <PlusMenu plusButton={plusButton} setPlusButton={setPlusButton} />
    </ReactFlow>
  );
}
