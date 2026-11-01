import * as color from "@mui/material/colors";
import { useTheme } from "@mui/material";
import {
  BaseEdge,
  EdgeToolbar,
  type EdgeProps,
  type EdgeTypes as FlowEdgeTypes,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
} from "@xyflow/react";
import type React from "react";
import { useGraphRender } from "@/components/GraphRenderContext.js";

const paths = { bezier: getBezierPath, step: getSmoothStepPath, straight: getStraightPath };

const EdgeComponent: React.FC<EdgeProps> = (props) => {
  const { id, selected = false, markerEnd } = props;
  const { edgeStyle, coarse, edgeToolbar } = useGraphRender();
  const theme = useTheme();
  const [path, labelX, labelY] = paths[edgeStyle](props);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={coarse ? 32 : 20}
        style={{
          stroke: selected ? theme.palette.text.primary : color.grey[500],
          strokeWidth: coarse ? 4 : 2.5,
        }}
      />
      {selected && edgeToolbar && (
        // beside the edge, as the selected edge is drawn above its toolbar
        <EdgeToolbar edgeId={id} x={labelX + 12} y={labelY} alignX="left" isVisible>
          {edgeToolbar(id)}
        </EdgeToolbar>
      )}
    </>
  );
};

export const EdgeTypes: FlowEdgeTypes = {
  default: EdgeComponent,
};

export default EdgeTypes;
