import type { XYPosition } from "@xyflow/react";
import * as arguebuf from "arguebuf";
import { enqueueSnackbar } from "notistack";
import type { RefObject } from "react";
import * as model from "@/model.js";
import type { ArgueStore, Panel, State } from "@/store/types.js";

/** Where `addNode` places the node and what it connects it to. */
export interface NodePlacement {
  /** Position on the canvas, the middle of the visible canvas by default. */
  position?: XYPosition;
  /** Connect the node to another one, as its premise unless `incoming` is set. */
  link?: { node: string; incoming?: boolean; scheme?: arguebuf.Scheme };
}

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
  /** Move the nodes without an undo step, e.g. to apply an automatic layout. */
  arrange: (positions: Iterable<readonly [string, XYPosition]>) => void;
  /** Show the panel, which becomes the most recently opened one. */
  openPanel: (panel: Panel) => void;
  /** Hide the given panels. */
  closePanels: (...panels: Panel[]) => void;
  /** Remove the selected elements together with the elements that depend on them. */
  deleteSelection: () => void;
  /** Add the node, connect it as given, and select it. */
  addNode: (node: model.Node, placement?: NodePlacement) => void;
}

/** Start a fresh assistant conversation, which also aborts a running reply. */
export function resetConversation(store: ArgueStore): void {
  store.setState((state) => ({
    assistantMessages: [],
    assistantConversation: state.assistantConversation + 1,
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
    const issue = arguebuf.catchGraphError(() => setState({ ...edit(graph, state), graph }));

    if (issue !== undefined) {
      enqueueSnackbar(model.describeIssue(issue), { variant: "warning" });
    }
  };

  const arrange: ArgueActions["arrange"] = (positions) => {
    const { isTracking, pause, resume } = temporal.getState();
    if (isTracking) pause();
    setState((state) => {
      const graph = state.graph.copy();
      model.moveNodes(graph, positions);

      return { graph };
    });
    if (isTracking) resume();
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

  const addNode: ArgueActions["addNode"] = (node, { position, link } = {}) => {
    const userdata = model.positioned(node, position ?? screenToFlow(canvasCenter()));
    editGraph((graph) => {
      graph.addNode(node.with({ userdata }));

      if (link) {
        const [source, target] = link.incoming ? [link.node, node.id] : [node.id, link.node];
        model.link(graph, source, target, link.scheme);
      }

      return { selection: model.nodeSelection(node.id) };
    });
  };

  const openPanel = (panel: Panel) => {
    setState((state) =>
      state.panels.at(-1) === panel
        ? {}
        : { panels: [...state.panels.filter((current) => current !== panel), panel] },
    );
  };

  const closePanels = (...panels: Panel[]) => {
    setState((state) => ({ panels: state.panels.filter((panel) => !panels.includes(panel)) }));
  };

  const deleteSelection = () => {
    editGraph((graph, { selection }) => {
      graph.removeElements(model.selectedIds(selection));
    });
  };

  return {
    setState,
    getState,
    editGraph,
    resetState,
    arrange,
    openPanel,
    closePanels,
    deleteSelection,
    addNode,
  };
}
