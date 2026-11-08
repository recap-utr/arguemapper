import { faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type IsValidConnection,
  type NodeChange,
  type NodeMouseHandler,
  type NodePositionChange,
  type OnConnect,
  type OnConnectEnd,
  type OnEdgesChange,
  type OnNodesChange,
  type OnReconnect,
  Panel,
  useReactFlow,
  type XYPosition,
} from "@xyflow/react";
import { omit } from "es-toolkit";
import React, { useCallback, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { EditorControls } from "@/components/canvas/EditorControls.js";
import { FileMenu } from "@/components/canvas/FileMenu.js";
import { Guide } from "@/components/canvas/Guide.js";
import { PanelToggles } from "@/components/canvas/PanelToggles.js";
import {
  SelectionToolbar,
  ToolbarButton,
  ToolbarPaper,
} from "@/components/canvas/SelectionToolbar.js";
import { SettingsButton } from "@/components/canvas/SettingsDialog.js";
import { GraphCanvas } from "@/components/GraphCanvas.js";
import type { NodePlacement } from "@/store/actions.js";
import { useAutoLayout } from "@/components/useAutoLayout.js";
import * as model from "@/model.js";
import {
  useArgueActions,
  useArgueConfig,
  useFlowWrapperRef,
  type DocumentState,
  useDocument,
  useInstanceFocused,
  useWorkspace,
} from "@/store.js";

type CanvasChange = NodeChange<model.CanvasNode> | EdgeChange<model.CanvasEdge>;
type Move = NodePositionChange & { position: XYPosition };

const selectedIds = (elements: readonly { id: string; selected?: boolean }[]): string[] =>
  elements.filter((element) => element.selected).map((element) => element.id);

const isMove = (change: CanvasChange): change is Move =>
  change.type === "position" && change.position !== undefined;

/** Toolbar of a selected edge. */
const EdgeActions: React.FC = () => {
  const { deleteSelection } = useArgueActions();

  return (
    <ToolbarPaper>
      <ToolbarButton title="Delete (Del)" icon={faTrash} color="error" onClick={deleteSelection} />
    </ToolbarPaper>
  );
};

const renderEdgeActions = () => <EdgeActions />;

/** Connect the nodes and select the scheme node inserted between atoms. */
function linkAndSelect(
  graph: model.GraphDraft,
  source: string,
  target: string,
): Pick<DocumentState, "selection"> | undefined {
  const scheme = model.link(graph, source, target);

  return scheme && { selection: model.nodeSelection(scheme.id) };
}

export default function Graph(): React.JSX.Element {
  const { editGraph, setState, arrange, openPanel, deleteSelection, getState, addNode } =
    useArgueActions();
  const { screenToFlowPosition } = useReactFlow();
  const { id, readOnly, toolbar, panels } = useArgueConfig();
  const wrapperRef = useFlowWrapperRef();
  const focused = useInstanceFocused();

  const graph = useDocument((state) => state.graph);
  const selection = useDocument((state) => state.selection);
  const edgeStyle = useWorkspace((state) => state.edgeStyle);
  // Graphs without coordinates (initial, restored, imported) lay themselves out.
  const needsLayout = useMemo(() => model.needsLayout(graph), [graph]);
  const shouldLayout = useDocument((state) => state.shouldLayout) || needsLayout;
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
  const nodes = useMemo(
    () => model.canvasNodes(graph, { selection, measured, dragged, editing: editingId }, nodeCache),
    [graph, selection, measured, dragged, editingId, nodeCache],
  );
  const edges = useMemo(
    () => model.canvasEdges(graph.edges, selection.edges, edgeCache),
    [graph.edges, selection.edges, edgeCache],
  );

  useAutoLayout({
    nodes,
    edges,
    layoutAlgorithm,
    shouldLayout,
    shouldFitView,
    setPositions: arrange,
    setShouldLayout: useCallback((v: boolean) => setState({ shouldLayout: v }), [setState]),
    setShouldFitView: useCallback((v: boolean) => setState({ shouldFitView: v }), [setState]),
  });

  useHotkeys(["delete", "backspace"], deleteSelection, {
    enabled: focused && !readOnly,
    preventDefault: true,
  });

  const finishEditing = useCallback(
    (id: string, text: string) => {
      const node = getState().graph.nodes[id];

      // unchanged texts add no undo step
      if (node?.type === "atom" && node.text !== text) {
        editGraph((graph) => graph.updateAtom(id, { text }));
      }

      setEditingId(undefined);
    },
    [editGraph, getState],
  );

  useHotkeys(
    "f2",
    () => {
      const { graph, selection } = getState();
      const node = model.selectedNode(graph, selection);

      if (node?.type === "atom") {
        setEditingId(node.id);
      }
    },
    { enabled: focused && !readOnly, preventDefault: true },
  );

  /**
   * Add a claim at the position on the screen and show its details.
   * New nodes are hidden until they are measured, so their text cannot be edited in place right away.
   */
  const addClaimAt = useCallback(
    (x: number, y: number, link?: NodePlacement["link"]) => {
      addNode(model.newAtom(), { position: screenToFlowPosition({ x, y }), link });
      openPanel("inspector");
    },
    [addNode, openPanel, screenToFlowPosition],
  );

  /**
   * Selecting only changes the selection, finished moves edit the graph.
   * `selected` are the ids selected after the changes if they select anything.
   */
  const commit = useCallback(
    (changes: readonly CanvasChange[], kind: keyof model.Selection, selected?: string[]) => {
      const moves = changes.filter(isMove).filter((change) => !change.dragging);

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
    },
    [editGraph, setState],
  );

  const onNodesChange: OnNodesChange<model.CanvasNode> = useCallback(
    (changes) => {
      const selects = changes.some((change) => change.type === "select");
      const resizes = changes.some((change) => change.type === "dimensions");
      // dragging changes only positions, which need no copy of all nodes
      const next = selects || resizes ? applyNodeChanges(changes, nodes) : nodes;
      const dragging = changes.filter(isMove).filter((change) => change.dragging);

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

      commit(changes, "nodes", selects ? selectedIds(next) : undefined);
    },
    [commit, nodes],
  );

  const onEdgesChange: OnEdgesChange<model.CanvasEdge> = useCallback(
    (changes) =>
      commit(
        changes,
        "edges",
        changes.some((change) => change.type === "select")
          ? selectedIds(applyEdgeChanges(changes, edges))
          : undefined,
      ),
    [commit, edges],
  );

  const isValidConnection: IsValidConnection = useCallback(
    ({ source, target }) => getState().graph.checkLink(source, target) === undefined,
    [getState],
  );

  const onConnect: OnConnect = useCallback(
    ({ source, target }) => editGraph((graph) => linkAndSelect(graph, source, target)),
    [editGraph],
  );

  // A connection dropped on the empty canvas creates a claim there and connects it.
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, { isValid, fromNode, fromHandle, toNode }) => {
      if (isValid || toNode !== null || fromNode === null || fromHandle === null) {
        return;
      }

      const { clientX, clientY } = "changedTouches" in event ? event.changedTouches[0] : event;
      addClaimAt(clientX, clientY, { node: fromNode.id, incoming: fromHandle.type === "source" });
    },
    [addClaimAt],
  );

  // moving an end of an edge replaces it, atoms are connected through a new scheme node
  const onReconnect: OnReconnect<model.CanvasEdge> = useCallback(
    (edge, { source, target }) => {
      editGraph((graph) => {
        graph.removeEdge(edge.id);

        return linkAndSelect(graph, source, target);
      });
    },
    [editGraph],
  );

  // a double click on the empty canvas adds a claim there
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.detail === 2) {
        addClaimAt(event.clientX, event.clientY);
      }
    },
    [addClaimAt],
  );

  // atoms are edited in place, other elements in the details
  const onNodeDoubleClick: NodeMouseHandler<model.CanvasNode> = useCallback(
    (_event, { data }) => {
      if (data.node.type === "atom" && !readOnly) {
        setEditingId(data.node.id);
      } else {
        openPanel("inspector");
      }
    },
    [openPanel, readOnly],
  );

  const onEdgeDoubleClick = useCallback(() => openPanel("inspector"), [openPanel]);

  // overlays do not depend on the canvas, so dragging does not render them again
  const overlays = useMemo(
    () => (
      <>
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
      </>
    ),
    [toolbar, panels],
  );

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
      onEdgeDoubleClick={onEdgeDoubleClick}
      edgeToolbar={readOnly ? undefined : renderEdgeActions}
      finishEditing={readOnly ? undefined : finishEditing}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
    >
      {overlays}
    </GraphCanvas>
  );
}
