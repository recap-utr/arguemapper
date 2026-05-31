import { useTheme } from "@mui/material";
import {
  ConnectionLineType,
  Controls,
  type EdgeMouseHandler,
  MiniMap,
  type NodeMouseHandler,
  type OnConnect,
  type OnConnectEnd,
  type OnConnectStart,
  type OnEdgesChange,
  type OnEdgesDelete,
  type OnInit,
  type OnNodesChange,
  type OnNodesDelete,
  type OnSelectionChangeFunc,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type RefObject, useMemo } from "react";
import * as model from "../model.js";
import { markerId } from "../store.js";
import { EdgeTypes } from "./EdgeTypes.js";
import { GraphRenderProvider } from "./GraphRenderContext.js";
import { Marker, MarkerDefinition } from "./Marker.js";
import { NodeTypes } from "./NodeTypes.js";

export interface GraphCanvasProps extends React.PropsWithChildren {
  /** Instance id; namespaces the ReactFlow instance and its SVG markers. */
  id: string;
  nodes: model.Node[];
  edges: model.Edge[];
  edgeStyle: model.EdgeStyle;
  majorClaim: string | undefined;

  /** Ref forwarded to the ReactFlow wrapper element (for coordinate transforms / image export). */
  wrapperRef?: RefObject<HTMLDivElement | null> | null;

  onNodesChange?: OnNodesChange<model.Node>;
  onEdgesChange?: OnEdgesChange<model.Edge>;
  onConnect?: OnConnect;
  onInit?: OnInit<model.Node, model.Edge>;
  onSelectionChange?: OnSelectionChangeFunc;
  onNodeClick?: NodeMouseHandler<model.Node>;
  onEdgeClick?: EdgeMouseHandler<model.Edge>;
  onNodeContextMenu?: NodeMouseHandler<model.Node>;
  onEdgeContextMenu?: EdgeMouseHandler<model.Edge>;
  onPaneContextMenu?: (event: React.MouseEvent | MouseEvent) => void;
  onNodeDoubleClick?: NodeMouseHandler<model.Node>;
  onEdgeDoubleClick?: EdgeMouseHandler<model.Edge>;
  onNodesDelete?: OnNodesDelete<model.Node>;
  onEdgesDelete?: OnEdgesDelete<model.Edge>;
  onClickConnectStart?: OnConnectStart;
  onClickConnectEnd?: OnConnectEnd;

  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
  edgesReconnectable?: boolean;
  /** ReactFlow `deleteKeyCode`; pass `null` to disable deletion. */
  deleteKeyCode?: string | string[] | null;

  /** Show the ReactFlow minimap overlay. */
  minimap?: boolean;
  /** Show the ReactFlow zoom/fit controls overlay. */
  controls?: boolean;
}

/**
 * Presentational ReactFlow canvas shared by the editor (`Graph`) and the read-only `GraphViewer`.
 * It owns nothing: data and behaviour come in as props, and it provides the {@link GraphRenderProvider}
 * the node/edge renderers depend on. Overlays (toolbar, menus, …) are passed as children.
 */
export function GraphCanvas({
  id,
  nodes,
  edges,
  edgeStyle,
  majorClaim,
  wrapperRef,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onInit,
  onSelectionChange,
  onNodeClick,
  onEdgeClick,
  onNodeContextMenu,
  onEdgeContextMenu,
  onPaneContextMenu,
  onNodeDoubleClick,
  onEdgeDoubleClick,
  onNodesDelete,
  onEdgesDelete,
  onClickConnectStart,
  onClickConnectEnd,
  nodesDraggable,
  nodesConnectable,
  edgesReconnectable,
  deleteKeyCode,
  minimap = false,
  controls = false,
  children,
}: GraphCanvasProps) {
  const theme = useTheme();

  const connectionLineType = useMemo(() => {
    switch (edgeStyle) {
      case model.EdgeStyle.BEZIER:
        return ConnectionLineType.Bezier;
      case model.EdgeStyle.STRAIGHT:
        return ConnectionLineType.Straight;
      case model.EdgeStyle.STEP:
        return ConnectionLineType.SmoothStep;
    }
  }, [edgeStyle]);

  const renderValue = useMemo(
    () => ({ instanceId: id, edgeStyle, majorClaim }),
    [id, edgeStyle, majorClaim],
  );

  return (
    <GraphRenderProvider value={renderValue}>
      <ReactFlow<model.Node, model.Edge>
        id={id}
        ref={wrapperRef}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onSelectionChange={onSelectionChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onClickConnectStart={onClickConnectStart}
        onClickConnectEnd={onClickConnectEnd}
        nodesDraggable={nodesDraggable}
        nodesConnectable={nodesConnectable}
        edgesReconnectable={edgesReconnectable}
        deleteKeyCode={deleteKeyCode}
        selectNodesOnDrag
        nodeTypes={NodeTypes}
        edgeTypes={EdgeTypes}
        minZoom={0.01}
        maxZoom={3}
        elevateEdgesOnSelect
        onlyRenderVisibleElements={nodes.length > 100}
        connectionLineType={connectionLineType}
        attributionPosition="bottom-center"
        colorMode={theme.palette.mode}
      >
        <MarkerDefinition>
          <Marker id={markerId(id, false)} />
          <Marker id={markerId(id, true)} color={theme.palette.text.primary} />
        </MarkerDefinition>
        {minimap && <MiniMap pannable zoomable />}
        {controls && <Controls showInteractive={false} />}
        {children}
      </ReactFlow>
    </GraphRenderProvider>
  );
}
