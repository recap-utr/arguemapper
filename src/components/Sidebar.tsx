import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import type React from "react";
import type { AssistantOptions } from "../services/assistant/chat.js";
import { type SidebarSection, useArgueActions, useStore } from "../store.js";
import Inspector from "./Inspector.js";
import Resources from "./Resources.js";
import { Assistant } from "./sidebar/Assistant.js";
import { Configuration } from "./sidebar/Configuration.js";
import { ImportExport } from "./sidebar/ImportExport.js";
import { Participants } from "./sidebar/Participants.js";
import { SECTION_ORDER } from "./sidebar/sections.js";

interface Props {
  assistant?: AssistantOptions;
}

/**
 * The collapsible sidebar. Any number of panes can be open at once; they stack vertically in
 * canonical section order, each splitting the height evenly and scrolling internally. Every pane
 * stays mounted (toggled via `display`) so chat history, text selections and scroll positions
 * survive hide/show. The collapse-all control lives in the main header. On desktop the panel
 * collapses inline; on mobile it overlays as a drawer.
 */
const Sidebar: React.FC<Props> = ({ assistant }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const side = useStore((state) => state.sidebarSide);
  const openSections = useStore((state) => state.sidebarSections);
  const width = useStore((state) => state.sidebarWidth);
  const { toggleSidebarSection, closeSidebar } = useArgueActions();

  const renderSection = (key: SidebarSection): React.ReactNode => {
    const onClose = () => toggleSidebarSection(key);
    switch (key) {
      case "inspector":
        return <Inspector onClose={onClose} />;
      case "resources":
        return <Resources onClose={onClose} />;
      case "assistant":
        return assistant ? <Assistant options={assistant} onClose={onClose} /> : null;
      case "importExport":
        return <ImportExport onClose={onClose} />;
      case "participants":
        return <Participants onClose={onClose} />;
      case "configuration":
        return <Configuration onClose={onClose} />;
    }
  };

  // A pane counts as open only if it's available in this instance (assistant may be disabled).
  const isOpen = (key: SidebarSection) =>
    openSections.includes(key) && (key !== "assistant" || assistant != null);
  const firstOpen = SECTION_ORDER.find(isOpen);
  const open = firstOpen !== undefined;

  const panel = (
    <Box
      sx={{
        height: "100%",
        width: isMobile ? "100%" : width,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {SECTION_ORDER.map((key) => {
        if (key === "assistant" && assistant == null) return null;
        const paneOpen = isOpen(key);
        return (
          <Box
            key={key}
            sx={{
              display: paneOpen ? "flex" : "none",
              flex: "1 1 0",
              minHeight: 0,
              flexDirection: "column",
              // Divider between stacked panes: every open pane except the topmost gets a top border.
              ...(paneOpen && key !== firstOpen && { borderTop: 1, borderColor: "divider" }),
            }}
          >
            {renderSection(key)}
          </Box>
        );
      })}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        anchor={side}
        open={open}
        onClose={closeSidebar}
        // Cap to the viewport so the 480px panel never overflows a narrow phone screen.
        slotProps={{ root: { keepMounted: true }, paper: { sx: { width, maxWidth: "100vw" } } }}
      >
        {panel}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "hidden",
        width: open ? width : 0,
        transition: theme.transitions.create("width", {
          easing: open ? theme.transitions.easing.easeOut : theme.transitions.easing.easeIn,
          duration: open
            ? theme.transitions.duration.enteringScreen
            : theme.transitions.duration.leavingScreen,
        }),
        // Divider faces the canvas.
        ...(side === "right"
          ? { borderLeft: 1, borderColor: "divider" }
          : { borderRight: 1, borderColor: "divider" }),
      }}
    >
      {panel}
    </Box>
  );
};

export default Sidebar;
