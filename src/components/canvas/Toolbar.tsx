import { Paper } from "@mui/material";
import type React from "react";
import { useGraphRender } from "@/components/GraphRenderContext.js";
import { TooltipIconButton, type TooltipIconButtonProps } from "@/components/TooltipIconButton.js";

/** Icon button of a canvas toolbar, larger for touch input. */
export const ToolbarButton: React.FC<Omit<TooltipIconButtonProps, "size">> = (props) => {
  const { coarse } = useGraphRender();

  return <TooltipIconButton size={coarse ? "large" : "medium"} {...props} />;
};

/** Paper holding the buttons of a canvas toolbar. */
export const ToolbarPaper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Paper elevation={4} sx={{ display: "flex", alignItems: "center", gap: 0.5, p: 0.5 }}>
    {children}
  </Paper>
);
