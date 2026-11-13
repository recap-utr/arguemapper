import type { XYPosition } from "@xyflow/react";
import * as arguebuf from "arguebuf";
import type { RefObject } from "react";
import * as model from "@/model.js";
import * as convert from "@/services/convert.js";
import { commit, redo, undo } from "@/store/history.js";
import { notify, openDocument } from "@/store/workspace.js";
import type { DocumentState, DocumentStore, Notice, Panel, WorkspaceStore } from "@/store/types.js";

/** Where `addNode` places the node and what it connects it to. */
export interface NodePlacement {
  /** Position on the canvas, the middle of the visible canvas by default. */
  position?: XYPosition;
  /** Connect the node to another one, as its premise unless `incoming` is set. */
  link?: { node: string; incoming?: boolean; scheme?: arguebuf.Scheme };
}

export interface ArgueActions {
  /** The state of the graph that the component shows. */
  getState: DocumentStore["getState"];
  setState: DocumentStore["setState"];
  getWorkspace: WorkspaceStore["getState"];
  setWorkspace: WorkspaceStore["setState"];
  /**
   * Edit a draft of the graph with its validated methods and store it, together with the returned state.
   * The selection is pruned to the remaining elements.
   * Violations of the strict graph model are shown to the user and leave the state unchanged.
   */
  editGraph: (
    edit: (graph: model.GraphDraft, state: DocumentState) => Partial<DocumentState> | void,
  ) => void;
  /**
   * Open the graph, an empty one by default, see `openDocument`.
   * Graphs given as JSON or file are loaded first, their repairs and load errors are shown to the user.
   */
  openGraph: (source?: convert.GraphSource) => void;
  /** Revert the last edit of the graph. */
  undo: () => void;
  /** Restore the last undone edit of the graph. */
  redo: () => void;
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
  /** Show the message to the user, replacing the current one. */
  notify: (message: string, severity: Notice["severity"]) => void;
}

export interface ActionsContext {
  readonly workspace: WorkspaceStore;
  /** The graph that the actions edit. */
  readonly doc: DocumentStore;
  /** Convert client coordinates to flow coordinates, e.g. `useReactFlow().screenToFlowPosition`. */
  readonly screenToFlow: (position: XYPosition) => XYPosition;
  /** The ReactFlow wrapper element of the editor for its geometry. */
  readonly wrapperRef: RefObject<HTMLElement | null>;
  /** Ignore edits of the graph, e.g. by hotkeys. */
  readonly readOnly: boolean;
}

/** Build the action helpers bound to a graph of a workspace, consumed via the `useArgueActions` hook. */
export function createActions({
  workspace,
  doc,
  screenToFlow,
  wrapperRef,
  readOnly,
}: ActionsContext): ArgueActions {
  const { getState, setState } = doc;

  const show: ArgueActions["notify"] = (message, severity) => notify(workspace, message, severity);

  const editGraph: ArgueActions["editGraph"] = (edit) => {
    if (readOnly) {
      return;
    }

    const state = getState();
    const issue = arguebuf.catchGraphError(() => {
      let changes: Partial<DocumentState> = {};
      const graph = state.graph.edit((draft) => {
        changes = edit(draft, state) ?? {};
      });
      commit(doc, graph, changes);
    });

    if (issue !== undefined) {
      show(arguebuf.describeIssue(issue), "warning");
    }
  };

  const openGraph: ArgueActions["openGraph"] = (source) => {
    const issues: arguebuf.Issue[] = [];

    convert
      .loadGraph(source, (issue) => issues.push(issue))
      .then(
        (graph) => {
          openDocument(workspace, { graph });

          if (issues.length > 0) {
            show(
              `The graph was repaired while loading it: ${issues.map(arguebuf.describeIssue).join(" ")}`,
              "warning",
            );
          }
        },
        (error: unknown) => {
          show(`The graph could not be loaded: ${model.describeError(error)}`, "error");
        },
      );
  };

  const arrange: ArgueActions["arrange"] = (positions) => {
    setState((state) => ({
      graph: state.graph.edit((draft) => model.moveNodes(draft, positions)),
    }));
  };

  const canvasCenter = (): XYPosition => {
    const el = wrapperRef.current;
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
    workspace.setState((state) =>
      state.panels.at(-1) === panel
        ? state
        : { panels: [...state.panels.filter((current) => current !== panel), panel] },
    );
  };

  const closePanels = (...panels: Panel[]) => {
    workspace.setState((state) => ({
      panels: state.panels.filter((panel) => !panels.includes(panel)),
    }));
  };

  const travel = (move: typeof undo) => () => {
    if (!readOnly) {
      move(doc);
    }
  };

  const deleteSelection = () => {
    editGraph((graph, { selection }) => {
      graph.removeElements(model.selectedIds(selection));
    });
  };

  return {
    getState,
    setState,
    getWorkspace: workspace.getState,
    setWorkspace: workspace.setState,
    editGraph,
    openGraph,
    undo: travel(undo),
    redo: travel(redo),
    arrange,
    openPanel,
    closePanels,
    deleteSelection,
    addNode,
    notify: show,
  };
}
