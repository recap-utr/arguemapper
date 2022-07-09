import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faCompress,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faRedo,
  faSitemap,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import produce from "immer";
import React, { useCallback } from "react";
import { useReactFlow } from "react-flow-renderer";
import layout from "../services/layout";
import { useGraph } from "./GraphContext";

interface ItemProps {
  disabled?: boolean;
  text: string;
  callback: () => void;
  icon: IconProp;
}

const Item: React.FC<ItemProps> = ({ disabled, text, callback, icon }) => {
  return (
    <Tooltip describeChild title={text} placement="right">
      <IconButton disabled={disabled ?? false} onClick={callback}>
        <FontAwesomeIcon icon={icon} />
      </IconButton>
    </Tooltip>
  );
};

export interface ToolbarProps {}

const Toolbar: React.FC<ToolbarProps> = () => {
  const { graph, setGraph, undo, undoable, redo, redoable, saveState } =
    useGraph();
  const flow = useReactFlow();

  const onLayout = useCallback(() => {
    layout(graph).then((layoutedNodes) => {
      setGraph(
        produce((draft) => {
          draft.nodes = layoutedNodes;
        })
      );

      saveState();
    });
  }, [setGraph, saveState]);

  return (
    <Box position="absolute" left={0} bottom={0} zIndex={10}>
      <Stack direction="column">
        <Item
          text="Automatically layout graph elements"
          callback={onLayout}
          icon={faSitemap}
        />
        <Item
          text="Undo last action"
          disabled={!undoable}
          callback={undo}
          icon={faUndo}
        />
        <Item
          text="Redo last action"
          disabled={!redoable}
          callback={redo}
          icon={faRedo}
        />
        <Item
          text="Zoom in"
          // disabled={zoom === cy?.maxZoom()}
          callback={() => {
            flow.zoomIn();
          }}
          icon={faMagnifyingGlassPlus}
        />
        <Item
          text="Zoom in"
          // disabled={zoom === cy?.minZoom()}
          callback={() => {
            flow.zoomOut();
          }}
          icon={faMagnifyingGlassMinus}
        />
        <Item
          text="Fit graph in view"
          // disabled={zoom === cy?.minZoom()}
          callback={() => {
            flow.fitView();
          }}
          icon={faCompress}
        />
      </Stack>
    </Box>
  );
};

export default Toolbar;
