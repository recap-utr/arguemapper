import type { GraphJson } from "arg-services/graph/v1/graph_pb";
import { ReactFlowProvider } from "@xyflow/react";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { ArgueMapperLayout } from "./ArgueMapperLayout.js";
import * as model from "./model.js";
import * as convert from "./services/convert.js";
import type { AssistantOptions } from "./services/assistant/chat.js";
import {
  type ArgueStore,
  ArgueConfigProvider,
  ArgueStoreProvider,
  createArgueStore,
  FlowWrapperProvider,
  type InspectorSlots,
  InspectorSlotsProvider,
  InstanceFocusProvider,
  useFocusWithin,
} from "./store.js";

export type ArgueMapperAssistantConfig = AssistantOptions;

const EMPTY_SLOTS: InspectorSlots = {};

export interface ArgueMapperProps extends React.PropsWithChildren {
  /** Seed graph (arguebuf JSON). Used unless persisted state exists for `persistKey`. */
  initialGraph?: GraphJson;
  /** Called with the arguebuf JSON whenever the graph (nodes/edges/graph) changes. */
  onChange?: (graph: GraphJson) => void;
  /** Disable all editing — pure viewer. */
  readOnly?: boolean;
  /** Show the on-canvas toolbar (undo/redo/zoom/fit/layout). */
  toolbar?: boolean;
  /** Show the left Resources sidebar. */
  leftSidebar?: boolean;
  /** Show the right Inspector sidebar. */
  rightSidebar?: boolean;
  /** Show the standalone header bar with sidebar toggles. */
  header?: boolean;
  /** Enable the AI assistant (absent => disabled). */
  assistant?: ArgueMapperAssistantConfig;
  /** Persist to localStorage under this key (absent => no persistence). */
  persistKey?: string;
  /** Unique id; namespaces the ReactFlow instance and its SVG markers. Defaults to a generated id. */
  id?: string;
  /** Host-provided content injected into the inspector accordions (e.g. extra import sources). */
  inspectorSlots?: InspectorSlots;
  style?: React.CSSProperties;
  className?: string;
}

export interface ArgueMapperHandle {
  exportGraph: (format?: "aif" | "arguebuf") => GraphJson;
  importGraph: (graph: GraphJson) => void;
  clear: () => void;
  fitView: () => void;
  layout: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  /** Escape hatch: the underlying zustand store for advanced integrations. */
  getStore: () => ArgueStore;
}

const sliceGraph = (store: ArgueStore) => {
  const { nodes, edges, graph, analyst } = store.getState();
  return { wrapper: { nodes, edges, graph }, analyst };
};

export const ArgueMapper = forwardRef<ArgueMapperHandle, ArgueMapperProps>(function ArgueMapper(
  {
    initialGraph,
    onChange,
    readOnly = false,
    toolbar = false,
    leftSidebar = false,
    rightSidebar = false,
    header = false,
    assistant,
    persistKey,
    id: idProp,
    inspectorSlots,
    style,
    className,
    children,
  },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  // Create the store exactly once per instance (StrictMode-safe via ref init).
  const storeRef = useRef<ArgueStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createArgueStore({
      initialGraph,
      persistKey,
      assistantConfig: assistant
        ? { model: assistant.model, baseURL: assistant.baseURL }
        : undefined,
    });
  }
  const store = storeRef.current;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const focused = useFocusWithin(rootRef);

  const assistantEnabled = assistant != null;
  const config = useMemo(
    () => ({ id, readOnly, toolbar, assistant: assistantEnabled }),
    [id, readOnly, toolbar, assistantEnabled],
  );

  // Keep the latest onChange in a ref so the subscription below never re-subscribes when the host
  // passes an inline callback.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Emit onChange when the graph slice (not selection/panel state) changes.
  useEffect(() => {
    let prev: { nodes: unknown; edges: unknown; graph: unknown } | null = null;
    return store.subscribe((state) => {
      const callback = onChangeRef.current;
      if (!callback) return;
      if (
        prev &&
        prev.nodes === state.nodes &&
        prev.edges === state.edges &&
        prev.graph === state.graph
      ) {
        return;
      }
      prev = { nodes: state.nodes, edges: state.edges, graph: state.graph };
      const { wrapper, analyst } = sliceGraph(store);
      callback(convert.exportGraph(wrapper, "arguebuf", analyst));
    });
  }, [store]);

  useImperativeHandle(
    ref,
    (): ArgueMapperHandle => ({
      exportGraph: (format = "arguebuf") => {
        const { wrapper, analyst } = sliceGraph(store);
        return convert.exportGraph(wrapper, format, analyst);
      },
      importGraph: (graph) => {
        const { nodes, edges, graph: g } = convert.importGraph(graph);
        store.setState({
          nodes,
          edges,
          graph: g,
          shouldLayout: model.needsLayout(nodes),
          shouldFitView: true,
        });
      },
      clear: () => {
        store.setState({
          nodes: [],
          edges: [],
          shouldFitView: true,
        });
      },
      fitView: () => {
        store.setState({ shouldFitView: true });
      },
      layout: () => {
        store.setState({ shouldLayout: true });
      },
      undo: () => store.temporal.getState().undo(),
      redo: () => store.temporal.getState().redo(),
      canUndo: () => store.temporal.getState().pastStates.length > 0,
      canRedo: () => store.temporal.getState().futureStates.length > 0,
      getStore: () => store,
    }),
    [store],
  );

  return (
    <div ref={rootRef} className={className} style={{ width: "100%", height: "100%", ...style }}>
      <ReactFlowProvider>
        <ArgueStoreProvider value={store}>
          <FlowWrapperProvider value={wrapperRef}>
            <ArgueConfigProvider value={config}>
              <InstanceFocusProvider value={focused}>
                <InspectorSlotsProvider value={inspectorSlots ?? EMPTY_SLOTS}>
                  <ArgueMapperLayout
                    header={header}
                    leftSidebar={leftSidebar}
                    rightSidebar={rightSidebar}
                    assistant={assistant}
                  />
                  {children}
                </InspectorSlotsProvider>
              </InstanceFocusProvider>
            </ArgueConfigProvider>
          </FlowWrapperProvider>
        </ArgueStoreProvider>
      </ReactFlowProvider>
    </div>
  );
});
