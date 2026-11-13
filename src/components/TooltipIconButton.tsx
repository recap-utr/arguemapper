import type { SvgIconComponent } from "@mui/icons-material";
import { IconButton, type IconButtonProps, Tooltip } from "@mui/material";
import type React from "react";

export interface TooltipIconButtonProps {
  title: string;
  icon: SvgIconComponent;
  onClick: () => void;
  color?: IconButtonProps["color"];
  size?: IconButtonProps["size"];
  disabled?: boolean;
}

/** Icon button labeled by its tooltip. */
export const TooltipIconButton: React.FC<TooltipIconButtonProps> = ({
  title,
  icon: Icon,
  ...props
}) => (
  <Tooltip title={title} describeChild>
    {/* disabled buttons receive no pointer events, so the tooltip listens on a wrapper */}
    <span style={{ display: "inline-flex" }}>
      <IconButton aria-label={title} {...props}>
        <Icon />
      </IconButton>
    </span>
  </Tooltip>
);
