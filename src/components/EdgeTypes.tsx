import { useTheme } from "@mui/material";
import * as color from "@mui/material/colors";
import { ComponentType } from "react";
import {
  BezierEdge,
  EdgeProps,
  EdgeTypes as FlowEdgeTypes,
} from "react-flow-renderer";

const EdgeComponent: ComponentType<EdgeProps> = (props) => {
  const theme = useTheme();
  const strokeColor = props.selected
    ? theme.palette.text.primary
    : color.grey[500];

  return (
    <BezierEdge
      {...props}
      style={{ stroke: strokeColor, strokeWidth: 2.5 }}
      markerEnd="url(#arguemapper-marker)"
    />
  );
};

const EdgeTypes: FlowEdgeTypes = {
  default: EdgeComponent,
};

export default EdgeTypes;
