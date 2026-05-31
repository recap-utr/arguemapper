import { Box, Stack, useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import Graph from "./components/Graph.js";
import Header from "./components/Header.js";
import Sidebar from "./components/Sidebar.js";
import type { AssistantOptions } from "./services/assistant/chat.js";
import { useArgueActions, useStore } from "./store.js";

export interface GraphEditorLayoutProps {
  header: boolean;
  sidebar: boolean;
  assistant?: AssistantOptions;
}

/** Internal layout: the graph canvas flanked by the single unified sidebar (left or right). */
export const GraphEditorLayout: React.FC<GraphEditorLayoutProps> = ({
  header,
  sidebar,
  assistant,
}) => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("lg"));
  const side = useStore((state) => state.sidebarSide);
  const { setStateWithoutHistory } = useArgueActions();

  // Collapse all panes when entering a small screen; the on-canvas switcher stays available.
  useEffect(() => {
    if (isMobile) setStateWithoutHistory({ sidebarSections: [] });
  }, [isMobile, setStateWithoutHistory]);

  return (
    <Stack direction="row" sx={{ height: "100%", width: "100%" }}>
      {sidebar && side === "left" && <Sidebar assistant={assistant} />}
      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        {header && <Header />}
        <Box onContextMenu={(e) => e.preventDefault()} sx={{ position: "relative", height: 1 }}>
          <Graph />
        </Box>
      </Stack>
      {sidebar && side === "right" && <Sidebar assistant={assistant} />}
    </Stack>
  );
};
