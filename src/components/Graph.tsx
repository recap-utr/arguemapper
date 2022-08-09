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
  NodeDragHandler,
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

// @ts-ignore
// cy.on("ehcomplete", (event, sourceNode, targetNode, addedEdge) => {
//   const sourceData = sourceNode.data() as cytoModel.node.Node;
//   const targetData = targetNode.data() as cytoModel.node.Node;
//   addedEdge.remove();

//   if (
//     cytoModel.node.isAtom(sourceData) &&
//     cytoModel.node.isAtom(targetData)
//   ) {
//     const sourcePos = sourceNode.position();
//     const targetPos = targetNode.position();

//     const position = {
//       x: (sourcePos.x + targetPos.x) / 2,
//       y: (sourcePos.y + targetPos.y) / 2,
//     };

//     const schemeData = cytoModel.node.initScheme({});

//     cy.add({
//       nodes: [{ data: schemeData, position }],
//       edges: [
//         {
//           data: cytoModel.edge.init({
//             source: sourceData.id,
//             target: schemeData.id,
//           }),
//         },
//         {
//           data: cytoModel.edge.init({
//             source: schemeData.id,
//             target: targetData.id,
//           }),
//         },
//       ],
//     });
//   } else {
//     // @ts-ignore
//     cy.add({
//       // @ts-ignore
//       edges: [
//         {
//           data: cytoModel.edge.init({
//             source: sourceData.id,
//             target: targetData.id,
//           }),
//         },
//       ],
//     });
//   }

//   eh.disableDrawMode();
//   updateGraph();
// });

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
  const [tmpNodes, setTmpNodes] = useState<Array<model.Node>>([...nodes]);
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
      tmpNodes.length &&
      tmpNodes.length > 0 &&
      tmpNodes.every(nodeHasDimension)
    ) {
      layout(tmpNodes, edges).then((layoutedNodes) => {
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
    tmpNodes,
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

  useEffect(() => {
    setTmpNodes([...nodes]);
  }, [nodes]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setTmpNodes((n) => applyNodeChanges(changes, n)),
    [setTmpNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) =>
      setState(
        produce(
          (draft: State) =>
            (draft.edges = applyEdgeChanges(changes, draft.edges))
        )
      ),
    [setState]
  );

  const onConnect: OnConnect = useCallback(
    (connection) =>
      setState(
        produce((draft: State) => {
          draft.edges = addEdge(connection, draft.edges);
        })
      ),
    [setState]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(() => {
    setState(
      produce((draft: State) => {
        draft.nodes = tmpNodes;
      })
    );
  }, [setState, tmpNodes]);

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
        draft.nodes = tmpNodes;
        draft.selection = {
          nodes: elems.nodes.map((node) => node.id),
          edges: elems.edges.map((edge) => edge.id),
        };
      })
    );

  return (
    <ReactFlow
      nodes={tmpNodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={onInit}
      onNodeContextMenu={onContextMenu}
      onEdgeContextMenu={onContextMenu}
      onPaneContextMenu={onContextMenu}
      onNodeDragStop={onNodeDragStop}
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
