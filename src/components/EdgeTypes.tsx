import { useMediaQuery, useTheme } from "@mui/material";
import * as color from "@mui/material/colors";
import {
  BezierEdge,
  EdgeProps,
  EdgeTypes as FlowEdgeTypes,
  SmoothStepEdge,
  StraightEdge,
} from "@xyflow/react";
import { ComponentType, useMemo } from "react";
import * as model from "../model.js";
import { useStore } from "../store.js";

const EdgeComponent: ComponentType<EdgeProps> = (props) => {
  const selected = props.selected;
  const edgeStyle = useStore((state) => state.edgeStyle);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const strokeColor = useMemo(
    () => (selected ? theme.palette.text.primary : color.grey[500]),
    [selected, theme.palette.text.primary],
  );
  const markerId = useMemo(
    () => (selected ? "arguemapper-marker-selected" : "arguemapper-marker"),
    [selected],
  );
  const size = isMobile ? 5 : 2.5;
  const extendedProps: EdgeProps = {
    ...props,
    style: { stroke: strokeColor, strokeWidth: size },
    markerEnd: `url(#${markerId})`,
  };

  switch (edgeStyle) {
    case model.EdgeStyle.BEZIER:
      return <BezierEdge {...extendedProps} />;
    case model.EdgeStyle.STEP:
      return <SmoothStepEdge {...extendedProps} />;
    case model.EdgeStyle.STRAIGHT:
      return <StraightEdge {...extendedProps} />;
  }
};

export const EdgeTypes: FlowEdgeTypes = {
  default: EdgeComponent,
};

export default EdgeTypes;
