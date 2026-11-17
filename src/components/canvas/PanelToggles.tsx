import type React from "react";
import { ToolbarButton, ToolbarPaper } from "@/components/canvas/Toolbar.js";
import { PANELS, usePanelLayout } from "@/components/panels/layout.js";
import { useArgueActions } from "@/store.js";

/**
 * Buttons to open the panels whose area is closed.
 * Open areas switch and close their panels in their own header.
 */
export const PanelToggles: React.FC = () => {
  const { areas, shown } = usePanelLayout();
  const { openPanel } = useArgueActions();
  const closed = areas.filter((area) => shown(area) === undefined).flat();

  if (closed.length === 0) {
    return null;
  }

  return (
    <ToolbarPaper>
      {closed.map((panel) => (
        <ToolbarButton
          key={panel}
          title={PANELS[panel].label}
          icon={PANELS[panel].icon}
          onClick={() => openPanel(panel)}
        />
      ))}
    </ToolbarPaper>
  );
};
