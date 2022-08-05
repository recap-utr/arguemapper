import { Box } from "@mui/material";
import { ComponentType } from "react";
import {
  Handle,
  NodeProps,
  NodeTypes as FlowNodeTypes,
  Position,
} from "react-flow-renderer";
import * as model from "../model";

const AtomComponent: ComponentType<NodeProps<model.AtomData>> = (node) => {
  return (
    <Box sx={{ background: "blue" }}>
      <Handle type="source" position={Position.Top} />
      <div>{model.nodeLabel(node)}</div>
      <Handle type="target" position={Position.Bottom} />
    </Box>
  );
};

const SchemeComponent: ComponentType<NodeProps<model.SchemeData>> = (node) => {
  return (
    <Box sx={{ background: "green" }}>
      <Handle type="source" position={Position.Top} />
      <div>{model.nodeLabel(node)}</div>
      <Handle type="target" position={Position.Bottom} />
    </Box>
  );
};

const NodeTypes: FlowNodeTypes = {
  atom: AtomComponent,
  scheme: SchemeComponent,
};

export default NodeTypes;
