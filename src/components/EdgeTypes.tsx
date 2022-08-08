import * as color from "@mui/material/colors";
import { ComponentType } from "react";
import {
  BezierEdge,
  EdgeProps,
  EdgeTypes as FlowEdgeTypes,
} from "react-flow-renderer";

const EdgeComponent: ComponentType<EdgeProps> = (props) => {
  return (
    <BezierEdge
      {...props}
      style={{ stroke: color.grey[500] }}
      markerEnd="url(#arguemapper-marker)"
    />
  );
};

const EdgeTypes: FlowEdgeTypes = {
  default: EdgeComponent,
};

export default EdgeTypes;
