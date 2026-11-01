import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import * as color from "@mui/material/colors";
import { Handle, type NodeProps, type NodeTypes as FlowNodeTypes, Position } from "@xyflow/react";
import type React from "react";
import type * as model from "@/model.js";
import { useGraphRender } from "@/components/GraphRenderContext.js";

const MAX_WIDTH = 300;
const MIN_WIDTH = 100;
const MIN_HEIGHT = 50;

/** Handle that grows while it is a connection target, see the classes React Flow assigns. */
const NodeHandle = styled(Handle, { shouldForwardProp: (prop) => prop !== "size" })<{
  size: number;
}>(({ theme, size }) => ({
  width: size,
  height: size,
  backgroundColor: color.grey[500],
  borderColor: theme.palette.text.primary,
  borderWidth: size / 5,
  transition: theme.transitions.create(["width", "height", "background-color"]),
  "&.connectingto, &.clickconnecting": { width: size * 1.6, height: size * 1.6 },
  "&.valid": { backgroundColor: theme.palette.success.main },
}));

/** Node of the canvas, colored like arguebuf renders it. */
const NodeComponent: React.FC<NodeProps<model.CanvasNode>> = ({ data, selected }) => {
  const { coarse } = useGraphRender();
  const { node, isMajorClaim } = data;
  const { bg } = node.color(isMajorClaim, false);
  const size = (coarse ? 16 : 10) * (selected ? 1.4 : 1);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: bg,
        color: "white",
        padding: 1,
        borderRadius: 2,
        borderColor: selected ? "text.primary" : bg,
        borderStyle: "solid",
        borderWidth: 2,
        minWidth: MIN_WIDTH,
        maxWidth: MAX_WIDTH,
        minHeight: MIN_HEIGHT,
        textAlign: "center",
      }}
    >
      <NodeHandle type="source" position={Position.Top} size={size} />
      <div>{node.label}</div>
      <NodeHandle type="target" position={Position.Bottom} size={size} />
    </Box>
  );
};

export const NodeTypes: FlowNodeTypes = {
  atom: NodeComponent,
  scheme: NodeComponent,
};
