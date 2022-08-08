// https://github.com/wbkd/react-flow/issues/915#issuecomment-782581438
// https://gist.github.com/ambroseus/2f1ea898f39e8460e49cd80c9b5e9f5c

import React from "react";

interface MarkerProps extends React.PropsWithChildren {
  id: string;
  className?: string;
}

// https://github.com/wbkd/react-flow/blob/e93db697febd787326c939d17640855a1dc404d5/src/container/EdgeRenderer/MarkerDefinitions.tsx#L28
const Marker: React.FC<MarkerProps> = ({
  id,
  className = "react-flow__arrowhead",
  children,
}) => (
  <marker
    className={className}
    id={id}
    markerWidth={12.5}
    markerHeight={12.5}
    viewBox="-10 -10 20 20"
    markerUnits="strokeWidth"
    orient="auto"
    refX="0"
    refY="0"
  >
    {children}
  </marker>
);

interface MarkerSymbolProps {
  color: string;
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

interface MarkerDefinitionsProps {
  id: string;
  color: string;
  strokeWidth?: number;
}

export function MarkerDefinition({
  color,
  id,
  strokeWidth,
}: MarkerDefinitionsProps) {
  return (
    <svg>
      <defs>
        <Marker id={id}>
          <MarkerSymbol color={color} strokeWidth={strokeWidth} />
        </Marker>
      </defs>
    </svg>
  );
}

export default MarkerDefinition;
