import {
  type NodeMouseHandler,
  type OnSelectionChangeFunc,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import {
  forwardRef,
  type Ref,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { GraphCanvas } from "./components/GraphCanvas.js";
import { useAutoLayout } from "./components/useAutoLayout.js";
import type { GraphJson } from "arg-services/graph/v1/graph_pb";
import * as model from "./model.js";
import * as convert from "./services/convert.js";

export interface GraphViewerProps {
  /** The graph to display (arguebuf JSON). Controlled: updating it re-renders the view. */
  graph: GraphJson;
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
  onNodeClick?: NodeMouseHandler<model.Node>;
  onEdgeClick?: (event: React.MouseEvent, edge: model.Edge) => void;
  onSelectionChange?: OnSelectionChangeFunc;
  style?: React.CSSProperties;
  className?: string;
}

export interface GraphViewerHandle {
  fitView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Re-run auto-layout and fit the result into view. */
  layout: () => void;
}

interface InnerProps extends GraphViewerProps {
  viewerRef: Ref<GraphViewerHandle>;
}

function GraphViewerInner({
  graph,
  id: idProp,
  edgeStyle = model.EdgeStyle.STEP,
  layoutAlgorithm = model.LayoutAlgorithm.LAYERED,
  minimap = false,
  controls = false,
  onNodeClick,
  onEdgeClick,
  onSelectionChange,
  viewerRef,
}: InnerProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const flow = useReactFlow<model.Node, model.Edge>();

  const wrapper = useMemo(() => convert.importGraph(graph), [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(wrapper.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(wrapper.edges);
  const [shouldLayout, setShouldLayout] = useState(() => model.needsLayout(wrapper.nodes));
  const [shouldFitView, setShouldFitView] = useState(true);

  // Re-seed the canvas whenever the controlled `graph` prop changes. On mount this re-applies the
  // same values the state initializers already used, so React bails out without an extra render.
  useEffect(() => {
    setNodes(wrapper.nodes);
    setEdges(wrapper.edges);
    setShouldLayout(model.needsLayout(wrapper.nodes));
    setShouldFitView(true);
  }, [wrapper, setNodes, setEdges]);

  useAutoLayout({
    nodes,
    edges,
    layoutAlgorithm,
    shouldLayout,
    shouldFitView,
    setNodes,
    setShouldLayout,
    setShouldFitView,
  });

  useImperativeHandle(
    viewerRef,
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
      majorClaim={wrapper.graph.majorClaim}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onInit={() => void flow.fitView()}
      onSelectionChange={onSelectionChange}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      nodesDraggable
      nodesConnectable={false}
      edgesReconnectable={false}
      deleteKeyCode={null}
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
export const GraphViewer = forwardRef<GraphViewerHandle, GraphViewerProps>(
  function GraphViewer(props, ref) {
    const { style, className } = props;
    return (
      <div className={className} style={{ width: "100%", height: "100%", ...style }}>
        <ReactFlowProvider>
          <GraphViewerInner {...props} viewerRef={ref} />
        </ReactFlowProvider>
      </div>
    );
  },
);
