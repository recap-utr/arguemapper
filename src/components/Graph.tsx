import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, IconButton, Stack, useTheme } from "@mui/material";
import { produce } from "immer";
import { SnackbarAction, SnackbarKey, useSnackbar } from "notistack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ConnectionLineType,
  OnConnect,
  OnConnectEnd,
  OnConnectStart,
  OnEdgesChange,
  OnEdgesDelete,
  OnInit,
  OnNodesChange,
  OnNodesDelete,
  OnSelectionChangeFunc,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import * as model from "../model.js";
import { generateDemo } from "../services/demo.js";
import { layout } from "../services/layout.js";
import {
  State,
  resetState,
  setState,
  useStore,
  useTemporalStore,
} from "../store.js";
import { ContextMenu, Click as ContextMenuClick } from "./ContextMenu.js";
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
  const disableFirstVisit = useCallback(() => {
    setState({ firstVisit: false });
  }, []);
  // const isLoading = useStore((state) => state.isLoading);
  const setIsLoading = useCallback((value: boolean) => {
    setState({ isLoading: value });
  }, []);
  const shouldLayout = useStore((state) => state.shouldLayout);
  const edgeStyle = useStore((state) => state.edgeStyle);
  const setShouldLayout = useCallback((value: boolean) => {
    setState({ shouldLayout: value });
  }, []);
  const [shouldFit, setShouldFit] = useState(false);
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
            disableFirstVisit();
          }}
        >
          Load Demo
        </Button>
        <IconButton
          onClick={() => {
            closeSnackbar(key);
            disableFirstVisit();
          }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </IconButton>
      </Stack>
    ),
    [closeSnackbar, disableFirstVisit]
  );

  // useHotkeys("shift+z", () => {
  //   if (typeof undo === "function") {
  //     undo();
  //   }
  // });

  // useHotkeys("shift+y", () => {
  //   if (typeof redo === "function") {
  //     redo();
  //   }
  // });

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
    if (shouldFit) {
      flow.fitView();
      setShouldFit(false);
    }
  }, [shouldFit, setShouldFit, flow]);

  const nodeHasDimension = useCallback(
    (el: model.Node) => el.width && el.height,
    []
  );

  // useEffect(() => {
  //   const domNode = document.querySelector(
  //     "#react-flow .react-flow__renderer"
  //   ) as HTMLElement | null;

  //   if (domNode) {
  //     if (isLoading) {
  //       domNode.style.opacity = "0";
  //     } else {
  //       domNode.style.opacity = "1";
  //     }
  //   }
  // }, [isLoading]);

  useEffect(() => {
    if (shouldLayout && nodes.length > 0 && nodes.every(nodeHasDimension)) {
      setIsLoading(true);
      layout(nodes, edges, layoutAlgorithm).then((layoutedNodes) => {
        setState({ nodes: layoutedNodes });
        setShouldLayout(false);
        setShouldFit(true);
        setIsLoading(false);
      });
    }
  }, [
    setShouldFit,
    shouldLayout,
    setIsLoading,
    setShouldLayout,
    layoutAlgorithm,
    nodes,
    edges,
    nodeHasDimension,
  ]);

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setState((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setState((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
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

  const onNodesDelete: OnNodesDelete = useCallback((deletedNodes) => {
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
  }, []);
  const onEdgesDelete: OnEdgesDelete = useCallback((deletedEdges) => {
    const deletedEdgeIds = deletedEdges.map((edge) => edge.id);
    setState((state) => ({
      edges: state.edges.filter((edge) => !deletedEdgeIds.includes(edge.id)),
      selection: model.initSelection(),
    }));
  }, []);

  const onInit: OnInit = useCallback(
    (instance) => {
      instance.fitView();
      setIsLoading(false);
      resumeTemporal();
    },
    [resumeTemporal, setIsLoading]
  );

  const onContextMenu = (
    event: React.MouseEvent,
    target?: model.AtomNode | model.SchemeNode | model.Edge
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

  const onElementClick = useCallback(
    (event: React.MouseEvent, elem: model.Node | model.Edge) => {
      setState({ rightSidebarOpen: true });
    },
    []
  );

  const onClickConnectStart: OnConnectStart = useCallback((event, params) => {
    const { nodeId } = params;
    setState(
      produce((draft: State) => {
        const node = draft.nodes.find((node) => node.id === nodeId);

        if (node !== undefined) {
          node.data.userdata.clickConnect = true;
        }
      })
    );
  }, []);

  const onClickConnectEnd: OnConnectEnd = useCallback(() => {
    setState(
      produce((draft: State) => {
        draft.nodes
          .filter((node) => node.data.userdata.clickConnect)
          .forEach((node) => delete node.data.userdata.clickConnect);
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
    <ReactFlow
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
    >
      {/* <Loader /> */}
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
