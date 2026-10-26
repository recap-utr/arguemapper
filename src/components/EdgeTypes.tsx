import { useMediaQuery, useTheme } from "@mui/material";
import * as color from "@mui/material/colors";
import {
  BezierEdge,
  type EdgeProps,
  type EdgeTypes as FlowEdgeTypes,
  SmoothStepEdge,
  StraightEdge,
} from "@xyflow/react";
import { type ComponentType, useMemo } from "react";
import { markerId } from "@/store.js";
import { useGraphRender } from "@/components/GraphRenderContext.js";

const EdgeComponent: ComponentType<EdgeProps> = (props) => {
  const selected = props.selected;
  const { edgeStyle, instanceId } = useGraphRender();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const strokeColor = useMemo(
    () => (selected ? theme.palette.text.primary : color.grey[500]),
    [selected, theme.palette.text.primary],
  );
  const marker = markerId(instanceId, selected ?? false);
  const size = isMobile ? 5 : 2.5;
  const extendedProps: EdgeProps = {
    ...props,
    style: { stroke: strokeColor, strokeWidth: size },
    markerEnd: `url(#${marker})`,
  };

  switch (edgeStyle) {
    case "bezier":
      return <BezierEdge {...extendedProps} />;
    case "step":
      return <SmoothStepEdge {...extendedProps} />;
    case "straight":
      return <StraightEdge {...extendedProps} />;
  }
};

export const EdgeTypes: FlowEdgeTypes = {
  default: EdgeComponent,
};

export default EdgeTypes;
