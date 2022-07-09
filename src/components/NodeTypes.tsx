import { Box } from "@mui/material";
import { ComponentType } from "react";
import {
  Handle,
  NodeProps,
  NodeTypes as FlowNodeTypes,
  Position,
} from "react-flow-renderer";
import * as model from "../model";

const NodeType: ComponentType<NodeProps<model.NodeData>> = ({ data }) => {
  return (
    <Box>
      <Handle type="source" position={Position.Top} />
      <div>{model.nodeLabel(data)}</div>
      <Handle type="target" position={Position.Bottom} />
    </Box>
  );
};

const NodeTypes: FlowNodeTypes = {
  input: NodeType,
  default: NodeType,
  output: NodeType,
};

export default NodeTypes;
