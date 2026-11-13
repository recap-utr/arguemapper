import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { Box, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { PANELS, usePanelLayout } from "@/components/panels/layout.js";
import { TooltipIconButton } from "@/components/TooltipIconButton.js";
import { type Panel, useArgueActions } from "@/store.js";

interface Props {
  area: readonly Panel[];
  placement: "left" | "right" | "bottom";
  render: (panel: Panel) => React.ReactNode;
}

/**
 * An area beside or below the canvas that shows one of its panels, switched with tabs.
 * Hidden panels stay mounted, so chats, text selections, and scroll positions survive.
 */
export const PanelArea: React.FC<Props> = ({ area, placement, render }) => {
  const { wide, shown, hide } = usePanelLayout();
  const { openPanel } = useArgueActions();
  const [expanded, setExpanded] = useState(false);
  const active = shown(area);
  const border = { left: "borderRight", right: "borderLeft", bottom: "borderTop" }[placement];

  return (
    <Paper
      square
      elevation={0}
      component="section"
      sx={{
        display: active === undefined ? "none" : "flex",
        flexDirection: "column",
        flexShrink: 0,
        minWidth: 0,
        minHeight: 0,
        [border]: 1,
        borderColor: "divider",
        ...(placement === "bottom"
          ? { height: expanded ? 1 : "50%" }
          : { width: "clamp(300px, 30cqw, 460px)" }),
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          minHeight: 48,
          pl: area.length > 1 ? 0 : 2,
          pr: 0.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {area.length > 1 ? (
          <Tabs
            value={active ?? false}
            onChange={(_event, value: Panel) => openPanel(value)}
            variant="fullWidth"
            sx={{ flexGrow: 1 }}
          >
            {area.map((panel) => {
              const { label, icon: Icon } = PANELS[panel];

              return (
                <Tab
                  key={panel}
                  value={panel}
                  label={label}
                  // narrow screens lack the room for icons
                  icon={wide ? <Icon /> : undefined}
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
              );
            })}
          </Tabs>
        ) : (
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            {PANELS[area[0]].label}
          </Typography>
        )}
        {placement === "bottom" && (
          <TooltipIconButton
            title={expanded ? "Show the graph" : "Expand"}
            icon={expanded ? CloseFullscreenIcon : OpenInFullIcon}
            onClick={() => setExpanded((current) => !current)}
          />
        )}
        <TooltipIconButton title="Close" icon={CloseIcon} onClick={() => active && hide(active)} />
      </Stack>
      {area.map((panel) => (
        <Box
          key={panel}
          sx={{
            display: panel === active ? "flex" : "none",
            flexDirection: "column",
            flex: "1 1 0",
            minHeight: 0,
          }}
        >
          {render(panel)}
        </Box>
      ))}
    </Paper>
  );
};
