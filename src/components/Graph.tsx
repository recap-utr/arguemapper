import { Box, Divider, Stack, useTheme } from "@mui/material";
import {
  applyEdgeChanges,
  applyNodeChanges,
  ConnectionLineType,
  type OnConnect,
  type OnConnectEnd,
  type OnConnectStart,
  type OnEdgesChange,
  type OnEdgesDelete,
  type OnInit,
  type OnNodesChange,
  type OnNodesDelete,
  type OnSelectionChangeFunc,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { produce } from "immer";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as model from "../model.js";
import { layout } from "../services/layout.js";
import {
  markerId,
  type State,
  useArgueActions,
  useArgueConfig,
  useFlowWrapperRef,
  useStore,
} from "../store.js";
import { ContextMenu, type Click as ContextMenuClick } from "./ContextMenu.js";
import { EdgeTypes } from "./EdgeTypes.js";
import { Marker, MarkerDefinition } from "./Marker.js";
import { NodeTypes } from "./NodeTypes.js";
import { PlusMenu } from "./PlusMenu.js";
import { SectionSwitcher } from "./SectionSwitcher.js";
import { Toolbar } from "./Toolbar.js";

export default function Graph() {
  const [ctxMenu, setCtxMenu] = useState<ContextMenuClick>({ open: false });
  const flow = useReactFlow();
  const theme = useTheme();
  const { setState, setStateWithoutHistory, resumeTemporal, openSidebarSection } =
    useArgueActions();
  const { id, readOnly, toolbar, sidebar } = useArgueConfig();
  const wrapperRef = useFlowWrapperRef();

  const numberOfNodes = useStore((state) => state.nodes.length);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const edgeStyle = useStore((state) => state.edgeStyle);
  const shouldLayout = useStore((state) => state.shouldLayout);
  const shouldFitView = useStore((state) => state.shouldFitView);
  const onlyRenderVisibleElements = numberOfNodes > 100;
  const layoutAlgorithm = useStore((state) => state.layoutAlgorithm);

  useEffect(() => {
    if (!shouldLayout && shouldFitView) {
      void flow.fitView();
      setStateWithoutHistory({ shouldFitView: false });
    }
  }, [shouldFitView, shouldLayout, flow, setStateWithoutHistory]);

  useEffect(() => {
    if (shouldLayout && nodes.length > 0 && nodes.every((node) => node.measured)) {
      void layout(nodes, edges, layoutAlgorithm)
        .then((layoutedNodes) => {
          setStateWithoutHistory({ nodes: layoutedNodes });
        })
        .finally(() => {
          setStateWithoutHistory({ shouldLayout: false });
        });
    }
  }, [shouldLayout, layoutAlgorithm, nodes, edges, setStateWithoutHistory]);

  const onNodesChange: OnNodesChange<model.Node> = useCallback(
    (changes) => {
      setState((state) => ({
        nodes: applyNodeChanges(changes, state.nodes),
      }));
    },
    [setState],
  );

  const onEdgesChange: OnEdgesChange<model.Edge> = useCallback(
    (changes) => {
      setState((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
      }));
    },
    [setState],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      setState(
        produce((draft: State) => {
          const source = draft.nodes.find((node) => node.id === connection.source);
          const target = draft.nodes.find((node) => node.id === connection.target);

          if (source && target && source.data.type === "atom" && target.data.type === "atom") {
            const schemePos = {
              x: (source.position.x + target.position.x) / 2,
              y: (source.position.y + target.position.y) / 2,
            };
            const scheme = model.initScheme({ data: {}, position: schemePos });

            draft.nodes.push(scheme);
            draft.edges.push(model.initEdge({ data: {}, source: source.id, target: scheme.id }));
            draft.edges.push(model.initEdge({ data: {}, source: scheme.id, target: target.id }));
          } else if (connection.source !== null && connection.target !== null) {
            draft.edges.push(
              model.initEdge({
                data: {},
                source: connection.source,
                target: connection.target,
              }),
            );
          }
        }),
      );
    },
    [setState],
  );

  const onNodesDelete: OnNodesDelete<model.Node> = useCallback(
    (deletedNodes) => {
      const deletedNodeIds = deletedNodes.map((node) => node.id);
      setState((state) => ({
        nodes: state.nodes.filter((node) => !deletedNodeIds.includes(node.id)),
        // one could also use getConnectedEdges from reactflow:
        // https://github.com/wbkd/react-flow/blob/769261fead0dbfd11f2c327787b18ffb925fc71f/packages/core/src/utils/graph.ts#L251
        edges: state.edges.filter(
          (edge) => !deletedNodeIds.includes(edge.source) && !deletedNodeIds.includes(edge.target),
        ),
        selection: model.initSelection(),
      }));
    },
    [setState],
  );
  const onEdgesDelete: OnEdgesDelete = useCallback(
    (deletedEdges) => {
      const deletedEdgeIds = deletedEdges.map((edge) => edge.id);
      setState((state) => ({
        edges: state.edges.filter((edge) => !deletedEdgeIds.includes(edge.id)),
        selection: model.initSelection(),
      }));
    },
    [setState],
  );

  const onInit: OnInit<model.Node, model.Edge> = useCallback(
    (instance) => {
      void instance.fitView();
      resumeTemporal();
    },
    [resumeTemporal],
  );

  const onContextMenu = (
    event: MouseEvent | React.MouseEvent<Element, MouseEvent>,
    target?: model.Node | model.Edge,
  ) => {
    setCtxMenu({
      event,
      target,
      open: true,
    });
  };

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    (elems) =>
      setState((state) => {
        const partialSelection = {
          nodes: elems.nodes.map((selectedNode) =>
            state.nodes.findIndex((node) => node.id === selectedNode.id),
          ),
          edges: elems.edges.map((selectedEdge) =>
            state.edges.findIndex((edge) => edge.id === selectedEdge.id),
          ),
        };

        const nodeTypes = elems.nodes.map((node) => node.type as "scheme" | "atom");

        return {
          selection: {
            ...partialSelection,
            type: model.selectionType(partialSelection, nodeTypes),
          },
        };
      }),
    [setState],
  );

  // Double-clicking an element reveals it in the Inspector for quick edits, without single-clicks
  // hijacking the sidebar.
  const onElementDoubleClick = useCallback(() => {
    openSidebarSection("inspector");
  }, [openSidebarSection]);

  const onClickConnectStart: OnConnectStart = useCallback(
    (_event, params) => {
      const { nodeId } = params;
      setState(
        produce((draft: State) => {
          const node = draft.nodes.find((node) => node.id === nodeId);

          if (node !== undefined) {
            (node.data.userdata as model.Userdata).clickConnect = true;
          }
        }),
      );
    },
    [setState],
  );

  const onClickConnectEnd: OnConnectEnd = useCallback(() => {
    setState(
      produce((draft: State) => {
        const nodesToUpdate = draft.nodes.filter(
          (node) => (node.data.userdata as model.Userdata).clickConnect,
        );
        for (const node of nodesToUpdate) {
          (node.data.userdata as model.Userdata).clickConnect = undefined;
        }
      }),
    );
  }, [setState]);

  const connectionLineType: ConnectionLineType = useMemo(() => {
    switch (edgeStyle) {
      case model.EdgeStyle.BEZIER:
        return ConnectionLineType.Bezier;
      case model.EdgeStyle.STRAIGHT:
        return ConnectionLineType.Straight;
      case model.EdgeStyle.STEP:
        return ConnectionLineType.SmoothStep;
    }
  }, [edgeStyle]);

  return (
    <ReactFlow<model.Node, model.Edge>
      id={id}
      ref={wrapperRef}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={readOnly ? undefined : onConnect}
      onInit={onInit}
      onNodeContextMenu={readOnly ? undefined : onContextMenu}
      onEdgeContextMenu={readOnly ? undefined : onContextMenu}
      onPaneContextMenu={readOnly ? undefined : onContextMenu}
      onNodeDoubleClick={onElementDoubleClick}
      onEdgeDoubleClick={onElementDoubleClick}
      onNodesDelete={readOnly ? undefined : onNodesDelete}
      onEdgesDelete={readOnly ? undefined : onEdgesDelete}
      onSelectionChange={onSelectionChange}
      onClickConnectStart={readOnly ? undefined : onClickConnectStart}
      onClickConnectEnd={readOnly ? undefined : onClickConnectEnd}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
      edgesReconnectable={!readOnly}
      deleteKeyCode={readOnly ? null : undefined}
      selectNodesOnDrag={true}
      nodeTypes={NodeTypes}
      edgeTypes={EdgeTypes}
      minZoom={0.01}
      maxZoom={3}
      elevateEdgesOnSelect={true}
      onlyRenderVisibleElements={onlyRenderVisibleElements}
      connectionLineType={connectionLineType}
      attributionPosition="bottom-center"
      colorMode={theme.palette.mode}
    >
      <MarkerDefinition>
        <Marker id={markerId(id, false)} />
        <Marker id={markerId(id, true)} color={theme.palette.text.primary} />
      </MarkerDefinition>
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
    </ReactFlow>
  );
}
