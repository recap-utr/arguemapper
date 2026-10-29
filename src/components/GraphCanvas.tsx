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
  type OnInit,
  type OnNodesChange,
  type OnSelectionChangeFunc,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type RefObject, useMemo } from "react";
import * as model from "@/model.js";
import { markerId } from "@/store.js";
import { EdgeTypes } from "@/components/EdgeTypes.js";
import { GraphRenderProvider } from "@/components/GraphRenderContext.js";
import { Marker, MarkerDefinition } from "@/components/Marker.js";
import { NodeTypes } from "@/components/NodeTypes.js";

export interface GraphCanvasProps extends React.PropsWithChildren {
  /** Instance id; namespaces the ReactFlow instance and its SVG markers. */
  id: string;
  nodes: model.CanvasNode[];
  edges: model.CanvasEdge[];
  edgeStyle: model.EdgeStyle;

  /** Ref forwarded to the ReactFlow wrapper element (for coordinate transforms / image export). */
  wrapperRef?: RefObject<HTMLDivElement | null> | null;

  onNodesChange?: OnNodesChange<model.CanvasNode>;
  onEdgesChange?: OnEdgesChange<model.CanvasEdge>;
  onConnect?: OnConnect;
  onInit?: OnInit<model.CanvasNode, model.CanvasEdge>;
  onSelectionChange?: OnSelectionChangeFunc;
  onNodeClick?: NodeMouseHandler<model.CanvasNode>;
  onEdgeClick?: EdgeMouseHandler<model.CanvasEdge>;
  onNodeContextMenu?: NodeMouseHandler<model.CanvasNode>;
  onEdgeContextMenu?: EdgeMouseHandler<model.CanvasEdge>;
  onPaneContextMenu?: (event: React.MouseEvent | MouseEvent) => void;
  onNodeDoubleClick?: NodeMouseHandler<model.CanvasNode>;
  onEdgeDoubleClick?: EdgeMouseHandler<model.CanvasEdge>;
  onClickConnectStart?: OnConnectStart;
  onClickConnectEnd?: OnConnectEnd;

  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
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
  onClickConnectStart,
  onClickConnectEnd,
  nodesDraggable,
  nodesConnectable,
  deleteKeyCode,
  minimap = false,
  controls = false,
  children,
}: GraphCanvasProps): React.JSX.Element {
  const theme = useTheme();

  const connectionLineType = useMemo(() => {
    switch (edgeStyle) {
      case "bezier":
        return ConnectionLineType.Bezier;
      case "straight":
        return ConnectionLineType.Straight;
      case "step":
        return ConnectionLineType.SmoothStep;
    }
  }, [edgeStyle]);

  const renderValue = useMemo(
    () => ({ instanceId: id, edgeStyle }),
    [id, edgeStyle],
  );

  return (
    <GraphRenderProvider value={renderValue}>
      <ReactFlow<model.CanvasNode, model.CanvasEdge>
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
        onClickConnectStart={onClickConnectStart}
        onClickConnectEnd={onClickConnectEnd}
        nodesDraggable={nodesDraggable}
        nodesConnectable={nodesConnectable}
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
