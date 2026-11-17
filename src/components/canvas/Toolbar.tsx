import type { SvgIconComponent } from "@mui/icons-material";
import { Button, Menu, Paper } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { useGraphRender } from "@/components/GraphRenderContext.js";
import { MenuCloseContext } from "@/components/MenuItems.js";
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

interface ToolbarMenuProps extends React.PropsWithChildren {
  label: string;
  icon: SvgIconComponent;
}

/** Labeled button of a canvas toolbar that opens a menu with the children as items, which may close it. */
export const ToolbarMenu: React.FC<ToolbarMenuProps> = ({ label, icon: Icon, children }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { coarse } = useGraphRender();
  const close = () => setAnchor(null);

  return (
    <>
      <Button
        size={coarse ? "large" : "medium"}
        startIcon={<Icon />}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {label}
      </Button>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={close}>
        <MenuCloseContext value={close}>{children}</MenuCloseContext>
      </Menu>
    </>
  );
};
