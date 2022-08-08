import { Stack, useTheme } from "@mui/material";
import * as color from "@mui/material/colors";
import React, { ComponentType } from "react";
import {
  Handle,
  NodeProps,
  NodeTypes as FlowNodeTypes,
  Position,
} from "react-flow-renderer";
import * as model from "../model";
import { useGraph } from "./GraphContext";

const MAX_WIDTH = 300;
const MIN_WIDTH = 100;
const MIN_HEIGHT = 50;

interface NodeComponentProps extends React.PropsWithChildren {
  node: NodeProps<model.NodeData>;
  bg: string;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  bg,
  children,
}) => {
  const theme = useTheme();

  return (
    <Stack
      direction="column"
      justifyContent="center"
      sx={{
        background: bg,
        padding: 1,
        borderRadius: 2,
        borderColor: node.selected ? theme.palette.text.primary : bg,
        borderStyle: "solid",
        borderWidth: 2,
        minWidth: MIN_WIDTH,
        maxWidth: MAX_WIDTH,
        minHeight: MIN_HEIGHT,
        textAlign: "center",
      }}
    >
      <Handle type="source" position={Position.Top} />
      {children}
      <Handle type="target" position={Position.Bottom} />
    </Stack>
  );
};

const AtomComponent: ComponentType<NodeProps<model.AtomData>> = (node) => {
  const body = <div>{model.nodeLabel(node)}</div>;
  const { graph } = useGraph();
  let bg: string = color.blue[500];

  if (graph.majorClaim === node.id) {
    bg = color.blue[900];
  }

  return (
    <NodeComponent node={node} bg={bg}>
      {body}
    </NodeComponent>
  );
};

const SchemeComponent: ComponentType<NodeProps<model.SchemeData>> = (node) => {
  const body = <div>{model.nodeLabel(node)}</div>;
  let bg: string = color.teal[500];

  if (node.data.scheme !== undefined) {
    if (node.data.scheme.type === model.SchemeType.SUPPORT) {
      bg = color.green[500];
    } else if (node.data.scheme.type === model.SchemeType.ATTACK) {
      bg = color.red[500];
    }
  }

  return (
    <NodeComponent node={node} bg={bg}>
      {body}
    </NodeComponent>
  );
};

const NodeTypes: FlowNodeTypes = {
  atom: AtomComponent,
  scheme: SchemeComponent,
};

export default NodeTypes;
