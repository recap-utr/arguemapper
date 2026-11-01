import { Box, Divider, Stack } from "@mui/material";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type NodeChange,
  type NodePositionChange,
  type OnConnect,
  type OnConnectEnd,
  type OnConnectStart,
  type OnEdgesChange,
  type OnInit,
  type OnNodesChange,
  type XYPosition,
} from "@xyflow/react";
import { omit } from "es-toolkit";
import React, { useCallback, useMemo, useState } from "react";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useFlowWrapperRef, useStore } from "@/store.js";
import { ContextMenu, type Click as ContextMenuClick } from "@/components/ContextMenu.js";
import { GraphCanvas } from "@/components/GraphCanvas.js";
import { PlusMenu } from "@/components/PlusMenu.js";
import { SectionSwitcher } from "@/components/SectionSwitcher.js";
import { Toolbar } from "@/components/Toolbar.js";
import { useAutoLayout } from "@/components/useAutoLayout.js";

type CanvasChange = NodeChange<model.CanvasNode> | EdgeChange<model.CanvasEdge>;
type Move = NodePositionChange & { position: XYPosition };

const selectedIds = (elements: readonly { id: string; selected?: boolean }[]): string[] =>
  elements.filter((element) => element.selected).map((element) => element.id);

const isMove = (change: CanvasChange): change is Move =>
  change.type === "position" && change.position !== undefined;

export default function Graph(): React.JSX.Element {
  const [ctxMenu, setCtxMenu] = useState<ContextMenuClick>({ open: false });
  const { editGraph, setState, setStateWithoutHistory, resumeTemporal, openSidebarSection } =
    useArgueActions();
  const { id, readOnly, toolbar, sidebar } = useArgueConfig();
  const wrapperRef = useFlowWrapperRef();

  const graph = useStore((state) => state.graph);
  const selection = useStore((state) => state.selection);
  const edgeStyle = useStore((state) => state.edgeStyle);
  // Graphs without coordinates (initial, restored, imported) lay themselves out.
  const shouldLayout = useStore((state) => state.shouldLayout || model.needsLayout(state.graph));
  const shouldFitView = useStore((state) => state.shouldFitView);
  const layoutAlgorithm = useStore((state) => state.layoutAlgorithm);

  // view state of the canvas, neither undoable nor persisted
  const [measured, setMeasured] = useState<Record<string, model.Dimensions>>({});
  const [dragged, setDragged] = useState<Record<string, XYPosition>>({});
  const [connecting, setConnecting] = useState<string>();
  const [nodeCache] = useState<model.CanvasCache<model.CanvasNode>>(() => new Map());
  const [edgeCache] = useState<model.CanvasCache<model.CanvasEdge>>(() => new Map());
  const nodes = useMemo(
    () => model.canvasNodes(graph, { selection, measured, dragged, connecting }, nodeCache),
    [graph, selection, measured, dragged, connecting, nodeCache],
  );
  const edges = useMemo(
    () => model.canvasEdges(graph.edges, selection.edges, edgeCache),
    [graph.edges, selection.edges, edgeCache],
  );

  // Layout/fit results bypass the undo history, so they go through `setStateWithoutHistory`.
  useAutoLayout({
    nodes,
    edges,
    layoutAlgorithm,
    shouldLayout,
    shouldFitView,
    setPositions: useCallback(
      (positions) =>
        setStateWithoutHistory((state) => {
          const graph = state.graph.copy();
          model.moveNodes(graph, positions);

          return { graph };
        }),
      [setStateWithoutHistory],
    ),
    setShouldLayout: useCallback(
      (v: boolean) => setStateWithoutHistory({ shouldLayout: v }),
      [setStateWithoutHistory],
    ),
    setShouldFitView: useCallback(
      (v: boolean) => setStateWithoutHistory({ shouldFitView: v }),
      [setStateWithoutHistory],
    ),
  });

  /**
   * Selecting only changes the selection, finished moves and removals edit the graph.
   * `selected` are the ids selected after the changes if they select anything.
   */
  const commit = useCallback(
    (changes: readonly CanvasChange[], kind: keyof model.Selection, selected?: string[]) => {
      const moves = changes.filter(isMove).filter((change) => !change.dragging);
      const removed = changes.flatMap((change) => (change.type === "remove" ? [change.id] : []));

      if (moves.length + removed.length > 0) {
        editGraph((graph, state) => {
          model.moveNodes(
            graph,
            moves.map((change) => [change.id, change.position] as const),
          );
          model.removeElements(graph, { ...model.emptySelection, [kind]: removed });

          return selected && { selection: { ...state.selection, [kind]: selected } };
        });
      } else if (selected !== undefined) {
        setState((state) => ({ selection: { ...state.selection, [kind]: selected } }));
      }

      if (moves.length > 0) {
        setDragged((current) =>
          omit(
            current,
            moves.map((change) => change.id),
          ),
        );
      }
    },
    [editGraph, setState],
  );

  const onNodesChange: OnNodesChange<model.CanvasNode> = useCallback(
    (changes) => {
      const next = applyNodeChanges(changes, nodes);
      const dragging = changes.filter(isMove).filter((change) => change.dragging);

      if (changes.some((change) => change.type === "dimensions")) {
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

      commit(
        changes,
        "nodes",
        changes.some((change) => change.type === "select") ? selectedIds(next) : undefined,
      );
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

  const onConnect: OnConnect = useCallback(
    ({ source, target }) => {
      editGraph((graph) => {
        const scheme = graph.link(source, target);

        if (scheme !== undefined) {
          const from = model.position(graph.nodes[source]);
          const to = model.position(graph.nodes[target]);
          model.moveNodes(graph, [[scheme.id, { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }]]);
        }
      });
    },
    [editGraph],
  );

  const onInit: OnInit<model.CanvasNode, model.CanvasEdge> = useCallback(
    (instance) => {
      void instance.fitView();
      resumeTemporal();
    },
    [resumeTemporal],
  );

  const onContextMenu = (
    event: MouseEvent | React.MouseEvent<Element, MouseEvent>,
    target?: model.CanvasElement,
  ) => {
    setCtxMenu({
      event,
      target,
      open: true,
    });
  };

  // Double-clicking an element reveals it in the Inspector for quick edits, without single-clicks
  // hijacking the sidebar.
  const onElementDoubleClick = useCallback(() => {
    openSidebarSection("inspector");
  }, [openSidebarSection]);

  const onClickConnectStart: OnConnectStart = useCallback(
    (_event, { nodeId }) => setConnecting(nodeId ?? undefined),
    [],
  );

  const onClickConnectEnd: OnConnectEnd = useCallback(() => setConnecting(undefined), []);

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
      onInit={onInit}
      onNodeContextMenu={readOnly ? undefined : onContextMenu}
      onEdgeContextMenu={readOnly ? undefined : onContextMenu}
      onPaneContextMenu={readOnly ? undefined : onContextMenu}
      onNodeDoubleClick={onElementDoubleClick}
      onEdgeDoubleClick={onElementDoubleClick}
      onClickConnectStart={readOnly ? undefined : onClickConnectStart}
      onClickConnectEnd={readOnly ? undefined : onClickConnectEnd}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
      deleteKeyCode={readOnly ? null : undefined}
    >
      <Box
        className="arguemapper-hidden"
        sx={{ position: "absolute", left: 10, bottom: 10, zIndex: 10 }}
      >
        <Stack direction="column" sx={{ alignItems: "center" }}>
          {toolbar && <Toolbar />}
          {toolbar && !readOnly && <Divider flexItem sx={{ mt: 0.5, mb: 1.5 }} />}
          <PlusMenu />
        </Stack>
      </Box>
      {!readOnly && <ContextMenu click={ctxMenu} setClick={setCtxMenu} />}
      {sidebar && (
        <Box
          className="arguemapper-hidden"
          sx={{ position: "absolute", right: 10, bottom: 10, zIndex: 10 }}
        >
          <SectionSwitcher />
        </Box>
      )}
    </GraphCanvas>
  );
}
