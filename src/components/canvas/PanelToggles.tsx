import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import type React from "react";
import { ToolbarPaper } from "@/components/canvas/SelectionToolbar.js";
import { useGraphRender } from "@/components/GraphRenderContext.js";
import { PANELS, usePanelLayout } from "@/components/panels/layout.js";
import { useArgueActions } from "@/store.js";

/**
 * Buttons to open the panels whose area is closed, labeled if the canvas has room for it.
 * Open areas switch and close their panels in their own header.
 */
export const PanelToggles: React.FC = () => {
  const { areas, shown } = usePanelLayout();
  const labeled = useMediaQuery(useTheme().breakpoints.up("lg"));
  const { openPanel } = useArgueActions();
  const { coarse } = useGraphRender();
  const closed = areas.filter((area) => shown(area) === undefined).flat();

  if (closed.length === 0) {
    return null;
  }

  return (
    <ToolbarPaper>
      {closed.map((panel) => {
        const { label, icon } = PANELS[panel];
        const iconElement = <FontAwesomeIcon icon={icon} fixedWidth />;

        return (
          <Tooltip key={panel} title={labeled ? "" : label}>
            <Button
              size={coarse ? "medium" : "small"}
              color="inherit"
              aria-label={label}
              startIcon={labeled && iconElement}
              onClick={() => openPanel(panel)}
              sx={{ minWidth: 0 }}
            >
              {labeled ? label : iconElement}
            </Button>
          </Tooltip>
        );
      })}
    </ToolbarPaper>
  );
};
