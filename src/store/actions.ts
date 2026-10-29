import type { XYPosition } from "@xyflow/react";
import * as arguebuf from "arguebuf";
import { enqueueSnackbar } from "notistack";
import type { RefObject } from "react";
import * as model from "@/model.js";
import type { ArgueStore, SidebarSection, State } from "@/store/types.js";

export interface ArgueActions {
  setState: ArgueStore["setState"];
  getState: ArgueStore["getState"];
  /**
   * Edit a copy of the graph with its validated methods and store it, together with the returned state.
   * The selection is pruned to the remaining elements.
   * Violations of the strict graph model are shown to the user and leave the state unchanged.
   */
  editGraph: (edit: (graph: model.Graph, state: State) => Partial<State> | void) => void;
  resetState: (graph?: model.Graph) => void;
  setStateWithoutHistory: (updater: Partial<State> | ((state: State) => Partial<State>)) => void;
  pauseTemporal: () => void;
  resumeTemporal: () => void;
  /** Show/hide a single pane, leaving the others untouched. */
  toggleSidebarSection: (section: SidebarSection) => void;
  /** Ensure a pane is open (no-op if already open). */
  openSidebarSection: (section: SidebarSection) => void;
  /** Collapse the sidebar by hiding every pane. */
  closeSidebar: () => void;
  /** Add the node at the given screen position (the canvas center by default) and select it. */
  addNodeAt: (node: model.Node, screenPos?: XYPosition) => void;
  canvasCenter: () => XYPosition;
}

/** Start a fresh assistant conversation, which also aborts a running reply. */
export function resetConversation(store: ArgueStore): void {
  store.setState((state) => ({
    assistantMessages: [],
    assistantConversation: state.assistantConversation + 1,
  }));
}

/** Store an edited graph together with further state, pruning the selection to its elements. */
export function commitGraph(store: ArgueStore, graph: model.Graph, changes?: Partial<State>): void {
  store.setState((state) => ({
    ...changes,
    graph,
    selection: model.pruneSelection(graph, changes?.selection ?? state.selection),
  }));
}

/**
 * Replace the graph wholesale (load/import/new), which starts a fresh assistant conversation.
 * Defaults to an empty graph.
 */
export function resetGraphState(store: ArgueStore, graph: model.Graph = model.newGraph()): void {
  store.setState({
    graph,
    selection: model.emptySelection,
    shouldLayout: false,
    shouldFitView: true,
  });
  resetConversation(store);
}

/**
 * Build the action helpers bound to a specific store instance (consumed via the `useArgueActions`
 * hook). `screenToFlow` converts client coordinates to flow coordinates (typically
 * `useReactFlow().screenToFlowPosition`); `wrapperRef` holds the instance's ReactFlow wrapper
 * element for geometry.
 */
export function createActions(
  store: ArgueStore,
  screenToFlow: (pos: XYPosition) => XYPosition,
  wrapperRef: RefObject<HTMLElement | null> | null,
): ArgueActions {
  const { getState, setState, temporal } = store;

  const editGraph: ArgueActions["editGraph"] = (edit) => {
    const state = getState();
    const graph = state.graph.copy();
    let changes: Partial<State> | void;

    try {
      changes = edit(graph, state);
    } catch (error) {
      if (!(error instanceof arguebuf.GraphError)) {
        throw error;
      }

      const { message, hint } = error.issue;
      enqueueSnackbar(hint === undefined ? message : `${message} ${hint}`, { variant: "warning" });

      return;
    }

    commitGraph(store, graph, changes ?? undefined);
  };

  const pauseTemporal = () => {
    temporal.getState().pause();
  };

  const resumeTemporal = () => {
    temporal.getState().resume();
  };

  const setStateWithoutHistory = (updater: Partial<State> | ((state: State) => Partial<State>)) => {
    const wasTracking = temporal.getState().isTracking;
    if (wasTracking) pauseTemporal();
    if (typeof updater === "function") {
      setState((state) => updater(state));
    } else {
      setState(updater);
    }
    if (wasTracking) resumeTemporal();
  };

  const resetState = (graph?: model.Graph) => resetGraphState(store, graph);

  const canvasCenter = (): XYPosition => {
    const el = wrapperRef?.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
    }
    // Fallback before the wrapper is laid out.
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  };

  const addNodeAt = (node: model.Node, screenPos?: XYPosition) => {
    const userdata = model.positioned(node, screenToFlow(screenPos ?? canvasCenter()));
    editGraph((graph) => {
      graph.addNode(node.with({ userdata }));

      return { selection: { nodes: [node.id], edges: [] } };
    });
  };

  const toggleSidebarSection = (section: SidebarSection) => {
    setState((state) => ({
      sidebarSections: state.sidebarSections.includes(section)
        ? state.sidebarSections.filter((s) => s !== section)
        : [...state.sidebarSections, section],
    }));
  };

  const openSidebarSection = (section: SidebarSection) => {
    setState((state) =>
      state.sidebarSections.includes(section)
        ? {}
        : { sidebarSections: [...state.sidebarSections, section] },
    );
  };

  const closeSidebar = () => {
    setState({ sidebarSections: [] });
  };

  return {
    setState,
    getState,
    editGraph,
    resetState,
    setStateWithoutHistory,
    pauseTemporal,
    resumeTemporal,
    toggleSidebarSection,
    openSidebarSection,
    closeSidebar,
    addNodeAt,
    canvasCenter,
  };
}
