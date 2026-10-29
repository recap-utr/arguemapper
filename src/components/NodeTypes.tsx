import { Stack, useMediaQuery, useTheme } from "@mui/material";
import * as color from "@mui/material/colors";
import {
  type NodeTypes as FlowNodeTypes,
  Handle,
  type HandleProps,
  type NodeProps,
  Position,
  useConnection,
} from "@xyflow/react";
import type React from "react";
import { useMemo } from "react";
import type * as model from "@/model.js";

const MAX_WIDTH = 300;
const MIN_WIDTH = 100;
const MIN_HEIGHT = 50;

interface NodeHandleProps extends HandleProps {
  isSelected?: boolean;
  nodeId: string;
}

const NodeHandle: React.FC<NodeHandleProps> = (props) => {
  const { isSelected, nodeId, ...handleProps } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const connection = useConnection();

  // Check if this handle is being targeted during a connection
  const isTargeted = useMemo(() => {
    if (!connection.inProgress) return false;

    if (handleProps.type === "target" && connection.toNode?.id === nodeId) {
      return true;
    }

    if (handleProps.type === "source" && connection.fromNode?.id === nodeId) {
      return true;
    }

    return false;
  }, [connection, handleProps.type, nodeId]);

  const baseSize = isMobile ? 15 : 10;
  const activeSize = isMobile ? 22 : 16;

  const size = isTargeted || isSelected ? activeSize : baseSize;

  const style = useMemo(
    () => ({
      width: size,
      height: size,
      backgroundColor: color.grey[500],
      borderColor: theme.palette.text.primary,
      borderWidth: size / 5,
      transition: "width 0.2s ease, height 0.2s ease, border-width 0.2s ease",
    }),
    [size, theme.palette.text.primary],
  );

  return <Handle {...handleProps} style={style} />;
};

/** Node of the canvas, colored like arguebuf renders it. */
const NodeComponent: React.FC<NodeProps<model.CanvasNode>> = ({ id, data, selected }) => {
  const theme = useTheme();
  const { node, isMajorClaim, connecting } = data;
  const background = connecting ? color.orange[500] : node.color(isMajorClaim, false).bg;
  const borderColor = selected ? theme.palette.text.primary : background;

  return (
    <Stack
      direction="column"
      sx={{
        justifyContent: "center",
        background,
        color: "white",
        padding: 1,
        borderRadius: 2,
        borderColor,
        borderStyle: "solid",
        borderWidth: 2,
        minWidth: MIN_WIDTH,
        maxWidth: MAX_WIDTH,
        minHeight: MIN_HEIGHT,
        textAlign: "center",
      }}
    >
      <NodeHandle type="source" position={Position.Top} isSelected={selected} nodeId={id} />
      <div>{node.label}</div>
      <NodeHandle type="target" position={Position.Bottom} isSelected={selected} nodeId={id} />
    </Stack>
  );
};

export const NodeTypes: FlowNodeTypes = {
  atom: NodeComponent,
  scheme: NodeComponent,
};
