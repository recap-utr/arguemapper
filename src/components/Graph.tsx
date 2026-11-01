import { faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type IsValidConnection,
  type NodeChange,
  type NodePositionChange,
  type OnConnect,
  type OnConnectEnd,
  type OnEdgesChange,
  type OnNodesChange,
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
import { SelectionToolbar, ToolbarButton, ToolbarPaper } from "@/components/canvas/SelectionToolbar.js";
import { SettingsButton } from "@/components/canvas/SettingsDialog.js";
import { GraphCanvas } from "@/components/GraphCanvas.js";
import { useAutoLayout } from "@/components/useAutoLayout.js";
import * as model from "@/model.js";
import {
  useArgueActions,
  useArgueConfig,
  useFlowWrapperRef,
  useInstanceFocused,
  useStore,
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

export default function Graph(): React.JSX.Element {
  const {
    editGraph,
    setState,
    arrange,
    openPanel,
    deleteSelection,
    getState,
    addNode,
  } = useArgueActions();
  const { screenToFlowPosition } = useReactFlow();
  const { id, readOnly, toolbar, panels } = useArgueConfig();
  const wrapperRef = useFlowWrapperRef();
  const focused = useInstanceFocused();

  const graph = useStore((state) => state.graph);
  const selection = useStore((state) => state.selection);
  const edgeStyle = useStore((state) => state.edgeStyle);
  // Graphs without coordinates (initial, restored, imported) lay themselves out.
  const needsLayout = useMemo(() => model.needsLayout(graph), [graph]);
  const shouldLayout = useStore((state) => state.shouldLayout) || needsLayout;
  const shouldFitView = useStore((state) => state.shouldFitView);
  const layoutAlgorithm = useStore((state) => state.layoutAlgorithm);

  // view state of the canvas, neither undoable nor persisted
  const [measured, setMeasured] = useState<Record<string, model.Dimensions>>({});
  const [dragged, setDragged] = useState<Record<string, XYPosition>>({});
  const [nodeCache] = useState<model.CanvasCache<model.CanvasNode>>(() => new Map());
  const [edgeCache] = useState<model.CanvasCache<model.CanvasEdge>>(() => new Map());
  const nodes = useMemo(
    () => model.canvasNodes(graph, { selection, measured, dragged }, nodeCache),
    [graph, selection, measured, dragged, nodeCache],
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
    ({ source, target }) => {
      editGraph((graph) => {
        const scheme = model.link(graph, source, target);

        return scheme && { selection: model.nodeSelection(scheme.id) };
      });
    },
    [editGraph],
  );

  // A connection dropped on the empty canvas creates a claim there and connects it.
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, { isValid, fromNode, fromHandle, toNode }) => {
      if (isValid || toNode !== null || fromNode === null || fromHandle === null) {
        return;
      }

      const { clientX, clientY } = "changedTouches" in event ? event.changedTouches[0] : event;
      addNode(model.newAtom(), {
        position: screenToFlowPosition({ x: clientX, y: clientY }),
        link: { node: fromNode.id, incoming: fromHandle.type === "source" },
      });
      openPanel("inspector");
    },
    [addNode, openPanel, screenToFlowPosition],
  );

  const onElementDoubleClick = useCallback(() => openPanel("inspector"), [openPanel]);

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
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={readOnly ? undefined : onConnect}
      onConnectEnd={readOnly ? undefined : onConnectEnd}
      isValidConnection={isValidConnection}
      onNodeDoubleClick={onElementDoubleClick}
      onEdgeDoubleClick={onElementDoubleClick}
      edgeToolbar={readOnly ? undefined : renderEdgeActions}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
    >
      {overlays}
    </GraphCanvas>
  );
}
