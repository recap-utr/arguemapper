import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { Box, IconButton, Paper, Stack, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import type React from "react";
import { createElement, useState } from "react";
import { PANELS, usePanelLayout } from "@/components/panels/layout.js";
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
            {area.map((panel) => (
              <Tab
                key={panel}
                value={panel}
                label={PANELS[panel].label}
                // narrow screens lack the room for icons
                icon={wide ? createElement(PANELS[panel].icon) : undefined}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            ))}
          </Tabs>
        ) : (
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            {PANELS[area[0]].label}
          </Typography>
        )}
        {placement === "bottom" && (
          <Tooltip title={expanded ? "Show the graph" : "Expand"}>
            <IconButton onClick={() => setExpanded((current) => !current)}>
              {expanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Close">
          <IconButton onClick={() => active && hide(active)}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
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
