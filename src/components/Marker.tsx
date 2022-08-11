// https://github.com/wbkd/react-flow/issues/915#issuecomment-782581438
// https://gist.github.com/ambroseus/2f1ea898f39e8460e49cd80c9b5e9f5c

import * as muiColor from "@mui/material/colors";
import React from "react";

interface MarkerProps extends MarkerSymbolProps {
  id: string;
  className?: string;
  size?: number;
}

// https://github.com/wbkd/react-flow/blob/e93db697febd787326c939d17640855a1dc404d5/src/container/EdgeRenderer/MarkerDefinitions.tsx#L28
export const Marker: React.FC<MarkerProps> = ({
  id,
  className = "react-flow__arrowhead",
  color = muiColor.grey[500],
  strokeWidth = 1,
  size = 15,
}) => (
  <marker
    className={className}
    id={id}
    markerWidth={size}
    markerHeight={size}
    viewBox="-10 -10 20 20"
    markerUnits="strokeWidth"
    orient="auto"
    refX="0"
    refY="0"
  >
    <MarkerSymbol color={color} strokeWidth={strokeWidth} />
  </marker>
);

interface MarkerSymbolProps {
  color?: string;
  strokeWidth?: number;
}

// https://github.com/wbkd/react-flow/blob/e93db697febd787326c939d17640855a1dc404d5/src/container/EdgeRenderer/MarkerSymbols.tsx#L20
const MarkerSymbol: React.FC<MarkerSymbolProps> = ({
  color,
  strokeWidth = 1,
}) => (
  <polyline
    stroke={color}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={strokeWidth}
    fill={color}
    points="-5,-4 0,0 -5,4 -5,-4"
  />
);

interface MarkerDefinitionsProps extends React.PropsWithChildren {}

export function MarkerDefinition({ children }: MarkerDefinitionsProps) {
  return (
    <svg>
      <defs>{children}</defs>
    </svg>
  );
}
