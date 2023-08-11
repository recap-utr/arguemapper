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
import React, { useCallback } from "react";
import { useReactFlow } from "reactflow";
import { setState, useTemporalStore } from "../store.js";

interface ItemProps {
  disabled?: boolean;
  text: string;
  callback?: () => void;
  icon: IconProp;
}

const Item: React.FC<ItemProps> = ({ disabled, text, callback, icon }) => {
  return (
    <Tooltip describeChild title={text} placement="right">
      <span>
        <IconButton disabled={disabled ?? false} onClick={callback}>
          <FontAwesomeIcon icon={icon} />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export interface ToolbarProps {}

export const Toolbar: React.FC<ToolbarProps> = () => {
  const undo = useTemporalStore((state) => state.undo);
  const redo = useTemporalStore((state) => state.redo);
  const futureStates = useTemporalStore((state) => state.futureStates);
  const pastStates = useTemporalStore((state) => state.pastStates);
  const undoable = pastStates.length > 0;
  const redoable = futureStates.length > 0;
  const setShouldLayout = useCallback((value: boolean) => {
    setState({ shouldLayout: value });
  }, []);
  const flow = useReactFlow();

  const onLayout = useCallback(() => {
    setShouldLayout(true);
  }, [setShouldLayout]);

  return (
    <Box
      className="arguemapper-hidden"
      position="absolute"
      left={0}
      bottom={0}
      zIndex={10}
    >
      <Stack direction="column">
        <Item
          text="Automatically layout graph elements"
          callback={onLayout}
          icon={faSitemap}
        />
        <Item
          text="Undo last action"
          disabled={!undoable}
          callback={() => {
            undo();
          }}
          icon={faUndo}
        />
        <Item
          text="Redo last action"
          disabled={!redoable}
          callback={() => {
            redo();
          }}
          icon={faRedo}
        />
        <Item
          text="Zoom in"
          callback={() => {
            flow.zoomIn();
          }}
          icon={faMagnifyingGlassPlus}
        />
        <Item
          text="Zoom in"
          callback={() => {
            flow.zoomOut();
          }}
          icon={faMagnifyingGlassMinus}
        />
        <Item
          text="Fit graph in view"
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
