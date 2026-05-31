import type { XYPosition } from "@xyflow/react";
import { produce } from "immer";
import * as model from "../model.js";
import type { ArgueStore, SidebarSection, State } from "./types.js";

export interface ArgueActions {
  setState: ArgueStore["setState"];
  getState: ArgueStore["getState"];
  mutate: (recipe: (draft: State) => void) => void;
  resetState: (preset?: model.Wrapper) => void;
  setStateWithoutHistory: (updater: Partial<State> | ((state: State) => Partial<State>)) => void;
  pauseTemporal: () => void;
  resumeTemporal: () => void;
  /** Show/hide a single pane, leaving the others untouched. */
  toggleSidebarSection: (section: SidebarSection) => void;
  /** Ensure a pane is open (no-op if already open). */
  openSidebarSection: (section: SidebarSection) => void;
  /** Collapse the sidebar by hiding every pane. */
  closeSidebar: () => void;
  clearAllSelections: () => void;
  selectSingleNode: (nodeIndex: number) => void;
  addNodeWithSelection: (node: model.Node) => void;
  addAtomAt: (screenPos?: XYPosition, text?: string) => void;
  addSchemeAt: (screenPos?: XYPosition) => void;
  canvasCenter: () => XYPosition;
}

const deselectAll = (draft: State) => {
  for (const node of draft.nodes) {
    node.selected = false;
  }
  for (const edge of draft.edges) {
    edge.selected = false;
  }
};

const selectNodeAtIndex = (draft: State, index: number) => {
  const node = draft.nodes[index];
  node.selected = true;
  draft.selection = { nodes: [index], edges: [], type: node.type };
};

/**
 * Replace the graph wholesale (load/import/new). Doubles as the single place that resets the
 * assistant conversation on a graph swap, so every entry point (the `resetState` action and the
 * host `importGraph`/`clear` handles) stays in sync. Defaults to an empty graph.
 */
export function resetGraphState(store: ArgueStore, preset?: model.Wrapper) {
  const s = preset ?? model.initWrapper({});
  store.setState({
    nodes: s.nodes,
    edges: s.edges,
    graph: s.graph,
    shouldLayout: model.needsLayout(s.nodes),
    shouldFitView: true,
    // A wholesale graph swap starts a fresh assistant conversation.
    assistantMessages: [],
    graphResetToken: store.getState().graphResetToken + 1,
  });
}

/**
 * Build the action helpers bound to a specific store instance (consumed via the `useArgueActions`
 * hook). `screenToFlow` converts client coordinates to flow coordinates (typically
 * `useReactFlow().screenToFlowPosition`); `getWrapperEl` yields the instance's ReactFlow wrapper
 * element for geometry.
 */
export function createActions(
  store: ArgueStore,
  screenToFlow: (pos: XYPosition) => XYPosition,
  getWrapperEl: () => HTMLElement | null,
): ArgueActions {
  const { getState, setState, temporal } = store;

  const mutate = (recipe: (draft: State) => void) => {
    setState(produce(recipe));
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

  const resetState = (preset?: model.Wrapper) => resetGraphState(store, preset);

  const canvasCenter = (): XYPosition => {
    const el = getWrapperEl();
    if (el !== null) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
    }
    // Fallback before the wrapper is laid out.
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  };

  const clearAllSelections = () => {
    mutate((draft) => {
      deselectAll(draft);
      draft.selection = model.initSelection();
    });
  };

  const selectSingleNode = (nodeIndex: number) => {
    mutate((draft) => {
      deselectAll(draft);
      if (draft.nodes[nodeIndex]) {
        selectNodeAtIndex(draft, nodeIndex);
      }
    });
  };

  const addNodeWithSelection = (node: model.Node) => {
    mutate((draft) => {
      deselectAll(draft);
      node.selected = true;
      draft.nodes.push(node);
      selectNodeAtIndex(draft, draft.nodes.length - 1);
    });
  };

  const addAtomAt = (screenPos?: XYPosition, text = "") => {
    const { x, y } = screenToFlow(screenPos ?? canvasCenter());
    addNodeWithSelection(model.initAtom({ data: { text }, position: { x, y } }));
  };

  const addSchemeAt = (screenPos?: XYPosition) => {
    const { x, y } = screenToFlow(screenPos ?? canvasCenter());
    addNodeWithSelection(model.initScheme({ data: {}, position: { x, y } }));
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
    mutate,
    resetState,
    setStateWithoutHistory,
    pauseTemporal,
    resumeTemporal,
    toggleSidebarSection,
    openSidebarSection,
    closeSidebar,
    clearAllSelections,
    selectSingleNode,
    addNodeWithSelection,
    addAtomAt,
    addSchemeAt,
    canvasCenter,
  };
}
