import { Box, useMediaQuery, useTheme } from "@mui/material";
import {
  ConnectionLineType,
  Controls,
  type EdgeMouseHandler,
  type IsValidConnection,
  MiniMap,
  type NodeMouseHandler,
  type OnConnect,
  type OnConnectEnd,
  type OnEdgesChange,
  type OnNodesChange,
  type OnMoveEnd,
  type OnReconnect,
  type OnSelectionChangeFunc,
  ReactFlow,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type ReactNode, type RefObject, useMemo } from "react";
import * as model from "@/model.js";
import { EdgeTypes } from "@/components/EdgeTypes.js";
import { GraphRenderProvider } from "@/components/GraphRenderContext.js";
import { NodeTypes } from "@/components/NodeTypes.js";

const connectionLineTypes: Record<model.EdgeStyle, ConnectionLineType> = {
  bezier: ConnectionLineType.Bezier,
  straight: ConnectionLineType.Straight,
  step: ConnectionLineType.SmoothStep,
};

export interface GraphCanvasProps extends React.PropsWithChildren {
  /** Instance id; namespaces the ReactFlow instance. */
  id: string;
  nodes: model.CanvasNode[];
  edges: model.CanvasEdge[];
  edgeStyle: model.EdgeStyle;

  /** Viewport to restore, the graph is fitted into view without one. */
  viewport?: Viewport;
  onMoveEnd?: OnMoveEnd;

  /** Ref forwarded to the ReactFlow wrapper element (for coordinate transforms / image export). */
  wrapperRef?: RefObject<HTMLDivElement | null> | null;

  onNodesChange?: OnNodesChange<model.CanvasNode>;
  onEdgesChange?: OnEdgesChange<model.CanvasEdge>;
  onConnect?: OnConnect;
  onConnectEnd?: OnConnectEnd;
  /** Move an end of an edge to another node. */
  onReconnect?: OnReconnect<model.CanvasEdge>;
  isValidConnection?: IsValidConnection;
  onPaneClick?: (event: React.MouseEvent) => void;
  /** Zoom in on double clicks on the empty canvas. */
  zoomOnDoubleClick?: boolean;
  onSelectionChange?: OnSelectionChangeFunc;
  onNodeClick?: NodeMouseHandler<model.CanvasNode>;
  onEdgeClick?: EdgeMouseHandler<model.CanvasEdge>;
  onNodeDoubleClick?: NodeMouseHandler<model.CanvasNode>;
  onEdgeDoubleClick?: EdgeMouseHandler<model.CanvasEdge>;
  /** Content of the toolbar of a selected edge. */
  edgeToolbar?: (edgeId: string) => ReactNode;
  /** Save the text of an atom edited on the canvas and stop editing it. */
  finishEditing?: (id: string, text: string) => void;

  nodesDraggable?: boolean;
  nodesConnectable?: boolean;

  /** Show the ReactFlow minimap overlay. */
  minimap?: boolean;
  /** Show the ReactFlow zoom/fit controls overlay. */
  controls?: boolean;
}

/**
 * Presentational ReactFlow canvas shared by the editor (`Graph`) and the read-only `GraphViewer`.
 * It owns nothing: data and behaviour come in as props, and it provides the {@link GraphRenderProvider}
 * the node/edge renderers depend on. Overlays (panels, toolbars, …) are passed as children.
 * Touch input enlarges the interactive elements and tolerates small movements of taps.
 */
export function GraphCanvas({
  id,
  nodes,
  edges,
  edgeStyle,
  viewport,
  wrapperRef,
  edgeToolbar,
  finishEditing,
  minimap = false,
  controls = false,
  children,
  ...props
}: GraphCanvasProps): React.JSX.Element {
  const theme = useTheme();
  const coarse = useMediaQuery("(pointer: coarse)");
  const buttonSize = coarse ? 44 : 32;

  const renderValue = useMemo(
    () => ({ edgeStyle, coarse, edgeToolbar, finishEditing }),
    [edgeStyle, coarse, edgeToolbar, finishEditing],
  );

  return (
    <GraphRenderProvider value={renderValue}>
      <Box
        sx={{
          width: 1,
          height: 1,
          "--xy-controls-button-background-color": theme.palette.background.paper,
          "--xy-controls-button-background-color-hover": theme.palette.action.hover,
          "--xy-controls-button-color": theme.palette.text.primary,
          "--xy-controls-button-border-color": theme.palette.divider,
          "& .react-flow__controls-button": {
            width: buttonSize,
            height: buttonSize,
            "& svg": { maxWidth: buttonSize / 2.5, maxHeight: buttonSize / 2.5 },
          },
        }}
      >
        <ReactFlow<model.CanvasNode, model.CanvasEdge>
          id={id}
          ref={wrapperRef}
          nodes={nodes}
          edges={edges}
          {...props}
          deleteKeyCode={null}
          fitView={viewport === undefined}
          fitViewOptions={model.fitViewOptions}
          onInit={(instance) => viewport && void instance.setViewport(viewport)}
          selectNodesOnDrag
          nodeTypes={NodeTypes}
          edgeTypes={EdgeTypes}
          minZoom={0.01}
          maxZoom={3}
          elevateEdgesOnSelect
          onlyRenderVisibleElements={nodes.length > 100}
          connectionLineType={connectionLineTypes[edgeStyle]}
          connectionRadius={coarse ? 40 : 20}
          nodeClickDistance={coarse ? 10 : 2}
          paneClickDistance={coarse ? 10 : 2}
          attributionPosition="bottom-center"
          colorMode={theme.palette.mode}
        >
          {minimap && <MiniMap pannable zoomable />}
          {controls && <Controls showInteractive={false} fitViewOptions={model.fitViewOptions} />}
          {children}
        </ReactFlow>
      </Box>
    </GraphRenderProvider>
  );
}
