import { faPlusCircle, faSitemap } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Menu, MenuItem } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  ControlButton,
  Controls,
  Elements,
  Handle,
  MiniMap,
  Position,
  useStoreState,
  useZoomPanHelper,
} from "react-flow-renderer";
import layout from "../services/layout";
import initialElements from "./initial-elements";

const CustomNodeComponent = ({ data }) => {
  return (
    <Box sx={{}}>
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </Box>
  );
};

const initialCtxMenu = {
  mouseX: null,
  mouseY: null,
};

const OverviewFlow = () => {
  const { fitView } = useZoomPanHelper();
  const nodeState = useStoreState((state) => state.nodes);
  const edgeState = useStoreState((state) => state.edges);
  const [elements, setElements] = useState<Elements>(initialElements);
  const [shouldLayout, setShouldLayout] = useState(false);
  const [shouldFitView, setShouldFitView] = useState(false);
  const nodeHasDimension = (node) => node.__rf != null && node.position != null;
  const [ctxMenu, setCtxMenu] = useState<{
    mouseX: null | number;
    mouseY: null | number;
  }>(initialCtxMenu);
  const handleClose = () => {
    setCtxMenu(initialCtxMenu);
  };

  useEffect(() => {
    if (shouldLayout && nodeState.length && nodeState.every(nodeHasDimension)) {
      const elementsWithLayout = layout(nodeState, edgeState);
      setElements(elementsWithLayout);
      setShouldLayout(false);
    }
  }, [shouldLayout, edgeState, nodeState]);

  useEffect(() => {
    if (!shouldLayout && shouldFitView) {
      fitView();
      setShouldFitView(false);
    }
  }, [shouldLayout, shouldFitView, fitView]);

  // const addNode = useCallback(() => {
  //   const newElem = {
  //     id: "999",
  //     data: { label: "Added node" },
  //     position: {
  //       x: 0,
  //       y: 0,
  //     },
  //   };
  //   setElements((e) => e.concat(newElem));
  // }, [setElements]);
  const addNode = () => {
    const [newElem, ...others] = elements;
    newElem.data.label = "Hello World!";
    setElements([newElem, ...others]);
  };

  return (
    <ReactFlow
      elements={elements}
      // onElementsRemove={onElementsRemove}
      // onConnect={onConnect}
      onLoad={() => {
        setShouldLayout(true);
        setShouldFitView(true);
      }}
      onNodeContextMenu={(event, node) => {
        event.preventDefault();
        setCtxMenu({
          mouseX: event.clientX,
          mouseY: event.clientY,
        });
      }}
      nodeTypes={{
        input: CustomNodeComponent,
        default: CustomNodeComponent,
        output: CustomNodeComponent,
      }}
      // snapToGrid={true}
      // snapGrid={[15, 15]}
    >
      <Menu
        keepMounted
        open={ctxMenu.mouseY !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          ctxMenu.mouseY !== null && ctxMenu.mouseX !== null
            ? { top: ctxMenu.mouseY, left: ctxMenu.mouseX }
            : undefined
        }
      >
        <MenuItem>Profile</MenuItem>
        <MenuItem>My account</MenuItem>
        <MenuItem>Logout</MenuItem>
      </Menu>
      <MiniMap
        style={{ backgroundColor: null }}
        nodeStrokeColor=""
        nodeColor={(n) => {
          return "#333";
        }}
        nodeBorderRadius={0}
        maskColor="#eee"
      />
      <Controls>
        <ControlButton onClick={() => setShouldLayout(true)}>
          <FontAwesomeIcon icon={faSitemap} />
        </ControlButton>
        <ControlButton onClick={addNode}>
          <FontAwesomeIcon icon={faPlusCircle} />
        </ControlButton>
      </Controls>
      <Background color="#aaa" gap={16} />
    </ReactFlow>
  );
};

export default OverviewFlow;
