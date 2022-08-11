import { useMediaQuery, useTheme } from "@mui/material";
import * as color from "@mui/material/colors";
import { ComponentType } from "react";
import {
  BezierEdge,
  EdgeProps,
  EdgeTypes as FlowEdgeTypes,
} from "react-flow-renderer";

const EdgeComponent: ComponentType<EdgeProps> = (props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const strokeColor = props.selected
    ? theme.palette.text.primary
    : color.grey[500];
  const markerId = props.selected
    ? "arguemapper-marker-selected"
    : "arguemapper-marker";
  const size = isMobile ? 5 : 2.5;

  return (
    <BezierEdge
      {...props}
      style={{ stroke: strokeColor, strokeWidth: size }}
      markerEnd={`url(#${markerId})`}
    />
  );
};

const EdgeTypes: FlowEdgeTypes = {
  default: EdgeComponent,
};

export default EdgeTypes;
