import { Box, InputBase } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Handle,
  type NodeProps,
  type NodeTypes as FlowNodeTypes,
  Position,
  useConnection,
  useOptionsStore,
} from "@xyflow/react";
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
  backgroundColor: theme.palette.grey[500],
  borderColor: theme.palette.text.primary,
  borderWidth: size / 5,
  transition: theme.transitions.create(["width", "height", "background-color"]),
  "&.connectingto, &.clickconnecting": { width: size * 1.6, height: size * 1.6 },
  "&.valid": { backgroundColor: theme.palette.success.main },
}));

/** Text of an atom edited in place, Enter or leaving it saves and Escape cancels. */
const TextEditor: React.FC<{ text: string; onDone: (text: string) => void }> = ({
  text,
  onDone,
}) => (
  <InputBase
    // keeps the canvas from dragging, panning, and zooming while typing and selecting
    className="nodrag nopan nowheel"
    multiline
    fullWidth
    // editing starts on request of the user, who expects to type right away
    // oxlint-disable-next-line jsx-a11y/no-autofocus
    autoFocus
    defaultValue={text}
    onFocus={(event) => event.currentTarget.select()}
    onBlur={(event) => onDone(event.currentTarget.value)}
    onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.currentTarget.value = text;
      } else if (event.key !== "Enter" || event.shiftKey) {
        return;
      }

      event.preventDefault();
      event.currentTarget.blur();
    }}
    sx={{ color: "inherit", font: "inherit", p: 0, "& textarea": { textAlign: "center" } }}
  />
);

/** Node of the canvas, colored like arguebuf renders it. */
const NodeComponent: React.FC<NodeProps<model.CanvasNode>> = ({ id, data, selected }) => {
  const { coarse, finishEditing } = useGraphRender();
  const { node, isMajorClaim, isEditing } = data;
  const { bg } = node.color({ majorClaim: isMajorClaim });
  const size = (coarse ? 16 : 10) * (selected ? 1.4 : 1);
  // primitive selections, so nodes only render again when a connection starts or ends
  const from = useConnection((c) => (c.inProgress ? c.fromNode.id : undefined));
  const outgoing = useConnection((c) => c.inProgress && c.fromHandle.type === "source");
  const isValidConnection = useOptionsStore((s) =>
    s.nodesConnectable ? s.isValidConnection : undefined,
  );
  // while connecting, the nodes that the connection cannot end at are dimmed
  const unreachable =
    from !== undefined &&
    from !== id &&
    isValidConnection !== undefined &&
    !isValidConnection({
      source: outgoing ? from : id,
      target: outgoing ? id : from,
      sourceHandle: null,
      targetHandle: null,
    });

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
        opacity: unreachable ? 0.35 : 1,
        transition: "opacity 150ms",
      }}
    >
      <NodeHandle type="source" position={Position.Top} size={size} />
      {node.type === "atom" && isEditing && finishEditing ? (
        <TextEditor text={node.text} onDone={(text) => finishEditing(id, text)} />
      ) : (
        <div>{node.label}</div>
      )}
      <NodeHandle type="target" position={Position.Bottom} size={size} />
    </Box>
  );
};

export const NodeTypes: FlowNodeTypes = {
  atom: NodeComponent,
  scheme: NodeComponent,
};
