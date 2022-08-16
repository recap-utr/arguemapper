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
import { useReactFlow } from "react-flow-renderer";
import useStore from "../store";

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

const Toolbar: React.FC<ToolbarProps> = () => {
  const [undo, redo, undoable, redoable] = useStore((state) => [
    state.undo,
    state.redo,
    state.undoable,
    state.redoable,
  ]);
  const setState = useStore((state) => state.setState);
  const setShouldLayout = useCallback(
    (value: boolean) => {
      setState({ shouldLayout: value });
    },
    [setState]
  );
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
          disabled={!undoable()}
          callback={undo}
          icon={faUndo}
        />
        <Item
          text="Redo last action"
          disabled={!redoable()}
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
