import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";
import {
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
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { produce } from "immer";
import { type SnackbarAction, type SnackbarKey, useSnackbar } from "notistack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as model from "../model.js";
import { generateDemo } from "../services/demo.js";
import { layout } from "../services/layout.js";
import {
  type State,
  resetState,
  setState,
  useStore,
  useTemporalStore,
} from "../store.js";
import { ContextMenu, type Click as ContextMenuClick } from "./ContextMenu.js";
import { EdgeTypes } from "./EdgeTypes.js";
import { Marker, MarkerDefinition } from "./Marker.js";
import { NodeTypes } from "./NodeTypes.js";
import { PlusMenu } from "./PlusMenu.js";
import { Toolbar } from "./Toolbar.js";

export default function Graph() {
  const [ctxMenu, setCtxMenu] = useState<ContextMenuClick>({ open: false });
  const [plusButton, setPlusButton] = React.useState<null | HTMLElement>(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const flow = useReactFlow();
  const theme = useTheme();

  const resumeTemporal = useTemporalStore((state) => state.resume);
  const numberOfNodes = useStore((state) => state.nodes.length);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const firstVisit = useStore((state) => state.firstVisit);
  const isLoading = useStore((state) => state.isLoading);
  const edgeStyle = useStore((state) => state.edgeStyle);
  const shouldLayout = useStore((state) => state.shouldLayout);
  const shouldFitView = useStore((state) => state.shouldFitView);
  const onlyRenderVisibleElements = numberOfNodes > 100;
  const layoutAlgorithm = useStore((state) => state.layoutAlgorithm);

  const snackbarAction: SnackbarAction = useCallback(
    (key: SnackbarKey) => (
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          disableElevation
          variant="contained"
          onClick={() => {
            resetState(generateDemo());
            closeSnackbar(key);
            setState({ firstVisit: false });
          }}
        >
          Load Demo
        </Button>
        <IconButton
          onClick={() => {
            closeSnackbar(key);
            setState({ firstVisit: false });
          }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </IconButton>
      </Stack>
    ),
    [closeSnackbar]
  );

  useEffect(() => {
    if (firstVisit) {
      enqueueSnackbar(
        "Hi there! If you are using this app for the first time, you may want to load our demo.",
        {
          key: "welcome",
          persist: true,
          variant: "info",
          action: snackbarAction,
        }
      );
    }
  }, [enqueueSnackbar, firstVisit, flow, snackbarAction]);

  useEffect(() => {
    if (!shouldLayout && shouldFitView) {
      flow.fitView();
      setState({ shouldFitView: false });
    }
  }, [shouldFitView, shouldLayout, flow]);

  useEffect(() => {
    const domNode = document.querySelector(
      "#react-flow .react-flow__renderer"
    ) as HTMLElement | null;

    if (domNode) {
      if (isLoading) {
        domNode.style.opacity = "0";
      } else {
        domNode.style.opacity = "1";
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (
      shouldLayout &&
      nodes.length > 0 &&
      nodes.every((node) => node.measured)
    ) {
      layout(nodes, edges, layoutAlgorithm)
        .then((layoutedNodes) => {
          setState({ nodes: layoutedNodes });
        })
        .finally(() => {
          setState({ shouldLayout: false });
        });
    }
  }, [shouldLayout, layoutAlgorithm, nodes, edges]);

  const onNodesChange: OnNodesChange<model.Node> = useCallback((changes) => {
    setState((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  }, []);

  const onEdgesChange: OnEdgesChange<model.Edge> = useCallback((changes) => {
    setState((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  }, []);

  const onConnect: OnConnect = useCallback((connection) => {
    setState(
      produce((draft: State) => {
        const source = draft.nodes.find(
          (node) => node.id === connection.source
        );
        const target = draft.nodes.find(
          (node) => node.id === connection.target
        );

        if (
          source &&
          target &&
          source.data.type === "atom" &&
          target.data.type === "atom"
        ) {
          const schemePos = {
            x: (source.position.x + target.position.x) / 2,
            y: (source.position.y + target.position.y) / 2,
          };
          const scheme = model.initScheme({ data: {}, position: schemePos });

          draft.nodes.push(scheme);
          draft.edges.push(
            model.initEdge({ data: {}, source: source.id, target: scheme.id })
          );
          draft.edges.push(
            model.initEdge({ data: {}, source: scheme.id, target: target.id })
          );
        } else if (connection.source !== null && connection.target !== null) {
          draft.edges.push(
            model.initEdge({
              data: {},
              source: connection.source,
              target: connection.target,
            })
          );
        }
      })
    );
  }, []);

  const onNodesDelete: OnNodesDelete<model.Node> = useCallback(
    (deletedNodes) => {
      const deletedNodeIds = deletedNodes.map((node) => node.id);
      setState((state) => ({
        nodes: state.nodes.filter((node) => !deletedNodeIds.includes(node.id)),
        // one could also use getConnectedEdges from reactflow:
        // https://github.com/wbkd/react-flow/blob/769261fead0dbfd11f2c327787b18ffb925fc71f/packages/core/src/utils/graph.ts#L251
        edges: state.edges.filter(
          (edge) =>
            !deletedNodeIds.includes(edge.source) &&
            !deletedNodeIds.includes(edge.target)
        ),
        selection: model.initSelection(),
      }));
    },
    []
  );
  const onEdgesDelete: OnEdgesDelete = useCallback((deletedEdges) => {
    const deletedEdgeIds = deletedEdges.map((edge) => edge.id);
    setState((state) => ({
      edges: state.edges.filter((edge) => !deletedEdgeIds.includes(edge.id)),
      selection: model.initSelection(),
    }));
  }, []);

  const onInit: OnInit<model.Node, model.Edge> = useCallback(
    (instance) => {
      instance.fitView();
      resumeTemporal();
    },
    [resumeTemporal]
  );

  const onContextMenu = (
    event: MouseEvent | React.MouseEvent<Element, MouseEvent>,
    target?: model.Node | model.Edge
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
            state.nodes.findIndex((node) => node.id === selectedNode.id)
          ),
          edges: elems.edges.map((selectedEdge) =>
            state.edges.findIndex((edge) => edge.id === selectedEdge.id)
          ),
        };

        const nodeTypes = elems.nodes.map(
          (node) => node.type as "scheme" | "atom"
        );

        return {
          selection: {
            ...partialSelection,
            type: model.selectionType(partialSelection, nodeTypes),
          },
        };
      }),
    []
  );

  const onElementClick = useCallback(() => {
    setState({ rightSidebarOpen: true });
  }, []);

  const onClickConnectStart: OnConnectStart = useCallback((event, params) => {
    const { nodeId } = params;
    setState(
      produce((draft: State) => {
        const node = draft.nodes.find((node) => node.id === nodeId);

        if (node !== undefined) {
          (node.data.userdata as model.Userdata).clickConnect = true;
        }
      })
    );
  }, []);

  const onClickConnectEnd: OnConnectEnd = useCallback(() => {
    setState(
      produce((draft: State) => {
        const nodesToUpdate = draft.nodes.filter(
          (node) => (node.data.userdata as model.Userdata).clickConnect
        );
        for (const node of nodesToUpdate) {
          (node.data.userdata as model.Userdata).clickConnect = undefined;
        }
      })
    );
  }, []);

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
      id="react-flow"
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={onInit}
      onNodeContextMenu={onContextMenu}
      onEdgeContextMenu={onContextMenu}
      onPaneContextMenu={onContextMenu}
      onNodeClick={onElementClick}
      onEdgeClick={onElementClick}
      onNodesDelete={onNodesDelete}
      onEdgesDelete={onEdgesDelete}
      onSelectionChange={onSelectionChange}
      onClickConnectStart={onClickConnectStart}
      onClickConnectEnd={onClickConnectEnd}
      selectNodesOnDrag={true}
      nodeTypes={NodeTypes}
      edgeTypes={EdgeTypes}
      minZoom={0.01}
      maxZoom={3}
      elevateEdgesOnSelect={true}
      onlyRenderVisibleElements={onlyRenderVisibleElements}
      connectionLineType={connectionLineType}
      attributionPosition="bottom-center"
      colorMode="system"
    >
      {isLoading && <Loader />}
      {/* <MiniMap
        // style={}
        nodeStrokeColor=""
        nodeColor={() => {
          return "#333";
        }}
        nodeBorderRadius={0}
        maskColor="#eee"
      /> */}
      {/* <Controls/> */}
      <MarkerDefinition>
        <Marker id="arguemapper-marker" />
        <Marker
          id="arguemapper-marker-selected"
          color={theme.palette.text.primary}
        />
      </MarkerDefinition>
      <Toolbar />
      <ContextMenu click={ctxMenu} setClick={setCtxMenu} />
      <PlusMenu plusButton={plusButton} setPlusButton={setPlusButton} />
    </ReactFlow>
  );
}

const Loader: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress size="25%" />
  </Box>
);
