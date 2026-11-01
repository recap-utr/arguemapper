import {
  type EdgeMouseHandler,
  type NodeMouseHandler,
  type OnSelectionChangeFunc,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { type Ref, useCallback, useId, useImperativeHandle, useMemo, useState } from "react";
import type * as arguebuf from "arguebuf";
import { GraphCanvas } from "@/components/GraphCanvas.js";
import { useAutoLayout } from "@/components/useAutoLayout.js";
import * as model from "@/model.js";
import * as convert from "@/services/convert.js";

export interface GraphViewerProps {
  /** The graph to display (arguebuf JSON). Controlled: updating it re-renders the view. */
  graph: arguebuf.GraphJson;
  /** Unique id; namespaces the ReactFlow instance and its SVG markers. Defaults to a generated id. */
  id?: string;
  /** Edge rendering style. Defaults to `"step"`. */
  edgeStyle?: model.EdgeStyle;
  /** Algorithm used to auto-layout graphs that lack stored node positions. Defaults to `"layered"`. */
  layoutAlgorithm?: model.LayoutAlgorithm;
  /** Show the minimap overlay. */
  minimap?: boolean;
  /** Show the zoom/fit controls overlay. */
  controls?: boolean;
  onNodeClick?: NodeMouseHandler<model.CanvasNode>;
  onEdgeClick?: EdgeMouseHandler<model.CanvasEdge>;
  onSelectionChange?: OnSelectionChangeFunc;
  style?: React.CSSProperties;
  className?: string;
  ref?: Ref<GraphViewerHandle>;
}

export interface GraphViewerHandle {
  fitView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Re-run auto-layout and fit the result into view. */
  layout: () => void;
}

function GraphViewerInner({
  graph,
  id: idProp,
  edgeStyle = "step",
  layoutAlgorithm = "layered",
  minimap = false,
  controls = false,
  onNodeClick,
  onEdgeClick,
  onSelectionChange,
  ref,
}: GraphViewerProps): React.JSX.Element {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const flow = useReactFlow<model.CanvasNode, model.CanvasEdge>();

  const imported = useMemo(() => {
    const loaded = convert.importGraph(graph);

    return {
      graph: loaded,
      nodes: model.canvasNodes(
        loaded,
        { selection: model.emptySelection, measured: {}, dragged: {} },
        new Map(),
      ),
      edges: model.canvasEdges(loaded.edges, [], new Map()),
    };
  }, [graph]);

  // view interactions such as dragging only change the local canvas
  const [nodes, setNodes, onNodesChange] = useNodesState(imported.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(imported.edges);
  const [shouldLayout, setShouldLayout] = useState(() => model.needsLayout(imported.graph));
  const [shouldFitView, setShouldFitView] = useState(true);

  // Re-seed the canvas during render whenever the controlled `graph` prop changes.
  const [seeded, setSeeded] = useState(imported);
  if (imported !== seeded) {
    setSeeded(imported);
    setNodes(imported.nodes);
    setEdges(imported.edges);
    setShouldLayout(model.needsLayout(imported.graph));
    setShouldFitView(true);
  }

  useAutoLayout({
    nodes,
    edges,
    layoutAlgorithm,
    shouldLayout,
    shouldFitView,
    setPositions: useCallback(
      (positions) =>
        setNodes((current) =>
          current.map((node) => {
            const position = positions.get(node.id);
            return position === undefined ? node : { ...node, position };
          }),
        ),
      [setNodes],
    ),
    setShouldLayout,
    setShouldFitView,
  });

  useImperativeHandle(
    ref,
    (): GraphViewerHandle => ({
      fitView: () => setShouldFitView(true),
      zoomIn: () => void flow.zoomIn(),
      zoomOut: () => void flow.zoomOut(),
      layout: () => {
        setShouldLayout(true);
        setShouldFitView(true);
      },
    }),
    [flow, setShouldFitView, setShouldLayout],
  );

  return (
    <GraphCanvas
      id={id}
      nodes={nodes}
      edges={edges}
      edgeStyle={edgeStyle}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onSelectionChange={onSelectionChange}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      nodesDraggable
      nodesConnectable={false}
      minimap={minimap}
      controls={controls}
    />
  );
}

/**
 * A pure, externally-controlled argument-graph viewer. The `graph` prop is the single source of
 * truth; local view interactions such as dragging nodes do not update the controlled graph.
 * Render it under an MUI `ThemeProvider` (e.g. the bundled `<GraphProviders>`); the editing-only
 * providers (notistack, material-ui-confirm) are not required.
 */
export function GraphViewer(props: GraphViewerProps): React.JSX.Element {
  const { style, className } = props;
  return (
    <div className={className} style={{ width: "100%", height: "100%", ...style }}>
      <ReactFlowProvider>
        <GraphViewerInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
