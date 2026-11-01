import type * as arguebuf from "arguebuf";
import { ReactFlowProvider } from "@xyflow/react";
import {
  type Ref,
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { GraphEditorLayout } from "@/GraphEditorLayout.js";
import * as model from "@/model.js";
import * as convert from "@/services/convert.js";
import type { AssistantOptions } from "@/services/assistant/chat.js";
import {
  type ArgueStore,
  ArgueConfigProvider,
  ArgueStoreProvider,
  createArgueStore,
  type EditorSlots,
  FlowWrapperProvider,
  InstanceFocusProvider,
  resetGraphState,
  SlotsProvider,
  useFocusWithin,
} from "@/store.js";

export type GraphEditorAssistantConfig = AssistantOptions;

const EMPTY_SLOTS: EditorSlots = {};

export interface GraphEditorProps extends React.PropsWithChildren {
  /**
   * The graph to edit, it replaces the current one (including a persisted one) whenever it changes.
   * Graphs are immutable, so the editor and the host can share them safely.
   */
  graph?: model.Graph;
  /** Called with the new graph after each change, e.g. an edit, an undo, or an import. */
  onGraphChange?: (graph: model.Graph) => void;
  /** Disable all editing — pure viewer. */
  readOnly?: boolean;
  /** Show the file menu, the settings, and the undo, redo, and layout controls. */
  toolbar?: boolean;
  /**
   * Show the panels for the text and the details of the selection, and the assistant if enabled.
   * Wide screens show them beside the canvas, narrow ones below it.
   */
  panels?: boolean;
  /** Enable the AI assistant (absent => disabled). */
  assistant?: GraphEditorAssistantConfig;
  /** Persist to localStorage under this key (absent => no persistence). */
  persistKey?: string;
  /** Unique id; namespaces the ReactFlow instance and its SVG markers. Defaults to a generated id. */
  id?: string;
  /** Host content added to the file menu and the settings. */
  slots?: EditorSlots;
  style?: React.CSSProperties;
  className?: string;
  ref?: Ref<GraphEditorHandle>;
}

export interface GraphEditorHandle {
  exportGraph: <F extends convert.ExportFormat>(format: F) => arguebuf.dump.Formats[F];
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

export function GraphEditor({
  graph,
  onGraphChange,
  readOnly = false,
  toolbar = false,
  panels = false,
  assistant,
  persistKey,
  id: idProp,
  slots,
  style,
  className,
  children,
  ref,
}: GraphEditorProps): React.JSX.Element {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  // Create the store exactly once per instance.
  const [store] = useState(() =>
    createArgueStore({
      graph,
      persistKey,
      assistantConfig: assistant,
      assistantApiKey: assistant?.apiKey,
    }),
  );

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const focused = useFocusWithin(rootRef);

  // The assistant edits the graph, so read-only instances hide it.
  const activeAssistant = readOnly ? undefined : assistant;
  const assistantEnabled = activeAssistant != null;
  const config = useMemo(
    () => ({ id, readOnly, toolbar, panels, assistant: assistantEnabled }),
    [id, readOnly, toolbar, panels, assistantEnabled],
  );

  // a new graph of the host replaces the current one as an edit that can be undone
  useEffect(() => {
    if (graph !== undefined && graph !== store.getState().graph) {
      store.setState({ graph });
    }
  }, [store, graph]);

  // reads the latest callback, so the subscription is kept when the host passes an inline one
  const emitChange = useEffectEvent((next: model.Graph) => onGraphChange?.(next));

  useEffect(
    () =>
      store.subscribe((state, previous) => {
        if (state.graph !== previous.graph) {
          emitChange(state.graph);
        }
      }),
    [store],
  );

  useImperativeHandle(
    ref,
    (): GraphEditorHandle => ({
      exportGraph: (format) => {
        const { graph, analyst } = store.getState();
        return convert.exportGraph(graph, format, analyst);
      },
      clear: () => resetGraphState(store),
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
                <SlotsProvider value={slots ?? EMPTY_SLOTS}>
                  <GraphEditorLayout assistant={activeAssistant} />
                  {children}
                </SlotsProvider>
              </InstanceFocusProvider>
            </ArgueConfigProvider>
          </FlowWrapperProvider>
        </ArgueStoreProvider>
      </ReactFlowProvider>
    </div>
  );
}
