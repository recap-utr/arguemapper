import { Stack, useMediaQuery, useTheme } from "@mui/material";
import * as color from "@mui/material/colors";
import React, { ComponentType, useMemo } from "react";
import {
  Handle,
  HandleProps,
  NodeProps,
  NodeTypes as FlowNodeTypes,
  Position,
} from "reactflow";
import * as model from "../model/index.js";
import { useStore } from "../store.js";

const MAX_WIDTH = 300;
const MIN_WIDTH = 100;
const MIN_HEIGHT = 50;

const NodeHandle: React.FC<HandleProps> = (props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const size = isMobile ? 15 : 10;

  return (
    <Handle
      {...props}
      style={{
        width: size,
        height: size,
        backgroundColor: color.grey[500],
        borderColor: theme.palette.text.primary,
        borderWidth: size / 5,
      }}
    />
  );
};

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
  const background = useMemo(
    () => (node.data.userdata.clickConnect ? color.orange[500] : bg),
    [node.data.userdata.clickConnect, bg]
  );
  const borderColor = useMemo(
    () => (node.selected ? theme.palette.text.primary : background),
    [background, node.selected, theme.palette.text.primary]
  );

  return (
    <Stack
      direction="column"
      justifyContent="center"
      sx={{
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
      <NodeHandle type="source" position={Position.Top} />
      {children}
      <NodeHandle type="target" position={Position.Bottom} />
    </Stack>
  );
};

const AtomComponent: ComponentType<NodeProps<model.AtomNodeData>> = (node) => {
  const body = <div>{node.data.label()}</div>;
  const majorClaim = useStore((state) => state.graph.majorClaim);

  const bg = useMemo(() => {
    if (majorClaim === node.id) {
      return color.blue[900];
    }

    return color.blue[500];
  }, [majorClaim, node.id]);

  return (
    <NodeComponent node={node} bg={bg}>
      {body}
    </NodeComponent>
  );
};

const SchemeComponent: ComponentType<NodeProps<model.SchemeNodeData>> = (
  node
) => {
  const body = <div>{node.data.label()}</div>;

  const bg = useMemo(() => {
    if (node.data.scheme.case === "support") {
      return color.green[500];
    } else if (node.data.scheme.case === "attack") {
      return color.red[500];
    }

    return color.teal[500];
  }, [node.data.scheme]);

  return (
    <NodeComponent node={node} bg={bg}>
      {body}
    </NodeComponent>
  );
};

export const NodeTypes: FlowNodeTypes = {
  atom: AtomComponent,
  scheme: SchemeComponent,
};
