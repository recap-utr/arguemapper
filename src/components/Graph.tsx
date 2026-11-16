import DeleteIcon from "@mui/icons-material/Delete";
import {
  type IsValidConnection,
  type NodeMouseHandler,
  type OnConnect,
  type OnConnectEnd,
  type OnEdgesChange,
  type OnNodesChange,
  type OnReconnect,
  Panel,
  type PositionChange,
  useReactFlow,
  type XYPosition,
} from "@xyflow/react";
import { omit } from "es-toolkit";
import type React from "react";
import { useState } from "react";
import { EditorControls } from "@/components/canvas/EditorControls.js";
import { FileMenu } from "@/components/canvas/FileMenu.js";
import { Guide } from "@/components/canvas/Guide.js";
import { PanelToggles } from "@/components/canvas/PanelToggles.js";
import { SelectionToolbar } from "@/components/canvas/SelectionToolbar.js";
import { SettingsButton } from "@/components/canvas/SettingsButton.js";
import { ToolbarButton, ToolbarPaper } from "@/components/canvas/Toolbar.js";
import { GraphCanvas } from "@/components/GraphCanvas.js";
import { useAutoLayout } from "@/components/useAutoLayout.js";
import { useEditorHotkeys } from "@/components/useEditorHotkeys.js";
import * as model from "@/model.js";
import {
  type DocumentState,
  type NodePlacement,
  useArgueActions,
  useArgueConfig,
  useDocument,
  useWorkspace,
} from "@/store.js";

type Move = PositionChange & { position: XYPosition };

const idsOfSelected = (elements: readonly { id: string; selected?: boolean }[]): string[] =>
  elements.filter((element) => element.selected).map((element) => element.id);

const isMove = (change: PositionChange): change is Move => change.position !== undefined;

/** Toolbar of a selected edge. */
const EdgeActions: React.FC = () => {
  const { deleteSelection } = useArgueActions();

  return (
    <ToolbarPaper>
      <ToolbarButton
        title="Delete (Del)"
        icon={DeleteIcon}
        color="error"
        onClick={deleteSelection}
      />
    </ToolbarPaper>
  );
};

/** Connect the nodes and select the scheme node inserted between atoms. */
function linkAndSelect(
  graph: model.GraphDraft,
  source: string,
  target: string,
): Pick<DocumentState, "selection"> | undefined {
  const scheme = model.link(graph, source, target);

  return scheme && { selection: model.nodeSelection(scheme.id) };
}

/** The canvas of the editor, which edits the shown graph. */
export const Graph: React.FC = () => {
  const { editGraph, setState, arrange, openPanel, deleteSelection, getState, addNode } =
    useArgueActions();
  const { screenToFlowPosition } = useReactFlow();
  const { id, readOnly, toolbar, panels, wrapperRef } = useArgueConfig();

  const graph = useDocument((state) => state.graph);
  const selection = useDocument((state) => state.selection);
  const edgeStyle = useWorkspace((state) => state.edgeStyle);
  // Graphs without coordinates (initial, restored, imported) lay themselves out.
  const shouldLayout = useDocument((state) => state.shouldLayout) || model.needsLayout(graph);
  const shouldFitView = useDocument((state) => state.shouldFitView);
  const layoutAlgorithm = useWorkspace((state) => state.layoutAlgorithm);

  // view state of the canvas, neither undoable nor persisted
  const [measured, setMeasured] = useState<Record<string, model.Dimensions>>({});
  const [dragged, setDragged] = useState<Record<string, XYPosition>>({});
  // id of the atom whose text is edited on the canvas
  const [editingId, setEditingId] = useState<string>();
  const [nodeCache] = useState<model.CanvasCache<model.CanvasNode>>(() => new Map());
  const [edgeCache] = useState<model.CanvasCache<model.CanvasEdge>>(() => new Map());
  // the viewport of the graph when it was shown before
  const [viewport] = useState(() => getState().viewport);
  const nodes = model.canvasNodes(
    graph,
    { selection, measured, dragged, editing: editingId },
    nodeCache,
  );
  const edges = model.canvasEdges(graph.edges, selection.edges, edgeCache);

  useAutoLayout({
    nodes,
    edges,
    layoutAlgorithm,
    shouldLayout,
    shouldFitView,
    setPositions: arrange,
    setShouldLayout: (value) => setState({ shouldLayout: value }),
    setShouldFitView: (value) => setState({ shouldFitView: value }),
  });

  useEditorHotkeys(["delete", "backspace"], deleteSelection);
  useEditorHotkeys("f2", () => setEditingId(model.selectedAtom(getState())?.id));

  const finishEditing = (id: string, text: string) => {
    const node = getState().graph.nodes[id];

    // unchanged texts add no undo step
    if (node?.type === "atom" && node.text !== text) {
      editGraph((graph) => graph.updateAtom(id, { text }));
    }

    setEditingId(undefined);
  };

  /**
   * Add a claim at the position on the canvas and show its details.
   * New nodes are hidden until they are measured, so their text cannot be edited in place right away.
   */
  const addClaimAt = (position: XYPosition, link?: NodePlacement["link"]) => {
    addNode(model.newAtom(), { position, link });
    openPanel("inspector");
  };

  /**
   * Selecting only changes the selection, finished moves edit the graph.
   * `selected` are the ids selected after the changes if they select anything.
   */
  const applyChanges = (
    finished: readonly Move[],
    kind: keyof model.Selection,
    selected?: string[],
  ) => {
    const moves = finished.filter((change) => !change.dragging);

    if (moves.length > 0) {
      editGraph((graph, state) => {
        model.moveNodes(
          graph,
          moves.map((change) => [change.id, change.position] as const),
        );

        return selected && { selection: { ...state.selection, [kind]: selected } };
      });
      setDragged((current) =>
        omit(
          current,
          moves.map((change) => change.id),
        ),
      );
    } else if (selected !== undefined) {
      setState((state) => ({ selection: { ...state.selection, [kind]: selected } }));
    }
  };

  const onNodesChange: OnNodesChange<model.CanvasNode> = (changes) => {
    const selects = changes.getByType("select").length > 0;
    const resizes = changes.getByType("dimensions").length > 0;
    // dragging changes only positions, which need no copy of all nodes
    const next = selects || resizes ? changes.applyTo(nodes) : nodes;
    const moves = changes.getByType("position").filter(isMove);
    const dragging = moves.filter((change) => change.dragging);

    if (resizes) {
      setMeasured(
        Object.fromEntries(
          next.flatMap((node) => (node.measured ? [[node.id, node.measured]] : [])),
        ),
      );
    }

    if (dragging.length > 0) {
      setDragged((current) => ({
        ...current,
        ...Object.fromEntries(dragging.map((change) => [change.id, change.position])),
      }));
    }

    applyChanges(moves, "nodes", selects ? idsOfSelected(next) : undefined);
  };

  const onEdgesChange: OnEdgesChange<model.CanvasEdge> = (changes) =>
    applyChanges(
      [],
      "edges",
      changes.getByType("select").length > 0 ? idsOfSelected(changes.applyTo(edges)) : undefined,
    );

  const isValidConnection: IsValidConnection = ({ source, target }) =>
    getState().graph.checkLink(source, target) === undefined;

  const onConnect: OnConnect = ({ source, target }) =>
    editGraph((graph) => linkAndSelect(graph, source, target));

  // A connection dropped on the empty canvas creates a claim there and connects it.
  const onConnectEnd: OnConnectEnd = (_event, connection) => {
    if (connection.fromHandle === null || connection.isValid || connection.toNode !== null) {
      return;
    }

    addClaimAt(connection.to, {
      node: connection.fromNode.id,
      incoming: connection.fromHandle.type === "source",
    });
  };

  // moving an end of an edge replaces it, atoms are connected through a new scheme node
  const onReconnect: OnReconnect<model.CanvasEdge> = (edge, { source, target }) => {
    editGraph((graph) => {
      graph.removeEdge(edge.id);

      return linkAndSelect(graph, source, target);
    });
  };

  // a double click on the empty canvas adds a claim there
  const onPaneClick = (event: React.MouseEvent) => {
    if (event.detail === 2) {
      addClaimAt(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    }
  };

  // atoms are edited in place, other elements in the details
  const onNodeDoubleClick: NodeMouseHandler<model.CanvasNode> = (_event, { data }) => {
    if (data.node.type === "atom" && !readOnly) {
      setEditingId(data.node.id);
    } else {
      openPanel("inspector");
    }
  };

  return (
    <GraphCanvas
      id={id}
      wrapperRef={wrapperRef}
      nodes={nodes}
      edges={edges}
      edgeStyle={edgeStyle}
      viewport={viewport}
      onMoveEnd={(_event, current) => setState({ viewport: current })}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={readOnly ? undefined : onConnect}
      onConnectEnd={readOnly ? undefined : onConnectEnd}
      onReconnect={readOnly ? undefined : onReconnect}
      isValidConnection={isValidConnection}
      onPaneClick={readOnly ? undefined : onPaneClick}
      zoomOnDoubleClick={readOnly}
      onNodeDoubleClick={onNodeDoubleClick}
      onEdgeDoubleClick={() => openPanel("inspector")}
      edgeToolbar={readOnly ? undefined : () => <EdgeActions />}
      finishEditing={readOnly ? undefined : finishEditing}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
    >
      <SelectionToolbar />
      {toolbar && (
        <>
          <Panel position="top-left">
            <ToolbarPaper>
              <FileMenu />
              <SettingsButton />
            </ToolbarPaper>
          </Panel>
          <EditorControls />
        </>
      )}
      {panels && (
        <>
          <Panel position="top-right">
            <PanelToggles />
          </Panel>
          <Guide />
        </>
      )}
    </GraphCanvas>
  );
};
