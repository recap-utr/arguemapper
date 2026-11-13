import { ReactFlowProvider, useEdgesState, useNodesState, useReactFlow } from "@xyflow/react";
import { type Ref, useImperativeHandle, useState } from "react";
import { GraphCanvas } from "@/components/GraphCanvas.js";
import { useAutoLayout } from "@/components/useAutoLayout.js";
import * as model from "@/model.js";

export interface GraphViewerProps {
  /** The graph to display. Controlled: updating it re-renders the view. */
  graph: model.Graph;
  /** Unique id that namespaces React Flow and its SVG markers, a generated one by default. */
  id?: string;
  /** Edge rendering style. Defaults to `"step"`. */
  edgeStyle?: model.EdgeStyle;
  /** Algorithm used to auto-layout graphs that lack stored node positions. Defaults to `"layered"`. */
  layoutAlgorithm?: model.LayoutAlgorithm;
  /** Show the minimap overlay. */
  minimap?: boolean;
  /** Show the zoom/fit controls overlay. */
  controls?: boolean;
  onNodeClick?: (node: model.Node) => void;
  onEdgeClick?: (edge: model.Edge) => void;
  /** Called with the ids of the selected nodes and edges. */
  onSelectionChange?: (selection: model.Selection) => void;
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
  id,
  edgeStyle = "step",
  layoutAlgorithm = "layered",
  minimap = false,
  controls = false,
  onNodeClick,
  onEdgeClick,
  onSelectionChange,
  ref,
}: GraphViewerProps): React.JSX.Element {
  const flow = useReactFlow<model.CanvasNode, model.CanvasEdge>();

  const initialNodes = model.canvasNodes(
    graph,
    { selection: model.emptySelection, measured: {}, dragged: {} },
    new Map(),
  );
  const initialEdges = model.canvasEdges(graph.edges, [], new Map());

  // view interactions such as dragging only change the local canvas
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [shouldLayout, setShouldLayout] = useState(() => model.needsLayout(graph));
  const [shouldFitView, setShouldFitView] = useState(true);

  // Re-seed the canvas during render whenever the controlled `graph` prop changes.
  const [seeded, setSeeded] = useState(graph);

  if (graph !== seeded) {
    setSeeded(graph);
    setNodes(initialNodes);
    setEdges(initialEdges);
    setShouldLayout(model.needsLayout(graph));
    setShouldFitView(true);
  }

  useAutoLayout({
    nodes,
    edges,
    layoutAlgorithm,
    shouldLayout,
    shouldFitView,
    setPositions: (positions) =>
      setNodes((current) =>
        current.map((node) => {
          const position = positions.get(node.id);
          return position === undefined ? node : { ...node, position };
        }),
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
      // the canvas reports its own elements, the host receives the ones of the graph
      onNodeClick={onNodeClick && ((_event, node) => onNodeClick(node.data.node))}
      onEdgeClick={onEdgeClick && ((_event, edge) => onEdgeClick(graph.edges[edge.id]))}
      onSelectionChange={
        onSelectionChange &&
        (({ nodes, edges }) =>
          onSelectionChange({
            nodes: nodes.map((node) => node.id),
            edges: edges.map((edge) => edge.id),
          }))
      }
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
 * Without an MUI `ThemeProvider` of the host, MUI's default theme applies.
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
