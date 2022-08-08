import * as color from "@mui/material/colors";
import produce from "immer";
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
} from "react-flow-renderer";
import useKeyboardJs from "react-use/lib/useKeyboardJs";
import * as model from "../model";
import ContextMenu, { Click as ContextMenuClick } from "./ContextMenu";
import EdgeTypes from "./EdgeTypes";
import { useGraph } from "./GraphContext";
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
  const [ctxMenu, setCtxMenu] = useState<ContextMenuClick>({});
  const [undoPressed] = useKeyboardJs("mod + z");
  const [redoPressed] = useKeyboardJs("mod + shift + z");
  const [plusButton, setPlusButton] = React.useState<null | HTMLElement>(null);

  const {
    // graph,
    // setGraph,
    undo,
    redo,
    undoable,
    redoable,
    setNodes,
    setEdges,
    saveState,
    setState,
    nodes,
    edges,
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

  // const openContextMenu = useCallback(
  //   (event: EventObject) => {
  //     const data = event.target.data();
  //     const size = containerSize();

  //     setCtxMenu({
  //       mouseX: event.originalEvent.clientX || size.width / 2,
  //       mouseY: event.originalEvent.clientY || size.height / 2,
  //       cytoX: event.position.x,
  //       cytoY: event.position.y,
  //       target: event.target,
  //       type: data.type
  //         ? data.type
  //         : data.source && data.target
  //         ? "edge"
  //         : "graph",
  //     });
  //   },
  //   [containerSize]
  // );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((n) => applyNodeChanges(changes, n)),
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((e) => applyEdgeChanges(changes, e)),
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection) =>
      setState(
        produce((draft) => {
          draft.edges = addEdge(connection, draft.edges);
        })
      ),
    [setState]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(() => {
    setState(
      produce((draft) => {
        draft.nodes = nodes;
      })
    );
  }, [setState, nodes]);

  const onNodesDelete: OnNodesDelete = useCallback(
    (deletedNodes) => {
      const deletedNodeIds = deletedNodes.map((node) => node.id);
      setState(
        produce((draft) => {
          draft.nodes = draft.nodes.filter(
            (node) => !deletedNodeIds.includes(node.id)
          );
        })
      );
    },
    [setState]
  );

  const onEdgeUpdateEnd = useCallback(() => {
    setState(
      produce((draft) => {
        draft.edges = edges;
      })
    );
  }, [setState, edges]);

  const onInit: OnInit = useCallback((instance) => {
    instance.fitView();
  }, []);

  const onContextMenu = (
    event: React.MouseEvent,
    target?: model.AtomNode | model.SchemeNode | model.Edge
  ) => {
    setCtxMenu({
      event,
      target,
    });
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={onInit}
      onNodeContextMenu={onContextMenu}
      onEdgeContextMenu={onContextMenu}
      onContextMenu={onContextMenu}
      onNodeDragStop={onNodeDragStop}
      onNodesDelete={onNodesDelete}
      onEdgeUpdateEnd={onEdgeUpdateEnd}
      nodeTypes={NodeTypes}
      edgeTypes={EdgeTypes}
      minZoom={0.01}
      maxZoom={3}
      // onlyRenderVisibleElements={true}
      attributionPosition="bottom-center"
      onSelectionChange={undefined}
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
        strokeWidth={5}
      />
      <Toolbar />
      <ContextMenu click={ctxMenu} setClick={setCtxMenu} />
      <PlusMenu plusButton={plusButton} setPlusButton={setPlusButton} />
    </ReactFlow>
  );
}
