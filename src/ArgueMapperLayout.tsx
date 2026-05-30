import { Box, Stack, useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import AssistantPanel from "./components/assistant/AssistantPanel.js";
import Graph from "./components/Graph.js";
import Header from "./components/Header.js";
import Inspector from "./components/Inspector.js";
import Resources from "./components/Resources.js";
import Sidebar from "./components/Sidebar.js";
import type { AssistantOptions } from "./services/assistant/chat.js";
import { useArgueActions, useStore } from "./store.js";

export interface ArgueMapperLayoutProps {
  header: boolean;
  leftSidebar: boolean;
  rightSidebar: boolean;
  assistant?: AssistantOptions;
}

/** Internal layout: optional left (Resources) / right (Inspector) sidebars around the graph. */
export const ArgueMapperLayout: React.FC<ArgueMapperLayoutProps> = ({
  header,
  leftSidebar,
  rightSidebar,
  assistant,
}) => {
  const sidebarWidth = useStore((state) => state.sidebarWidth);
  const isMobile = useMediaQuery(useTheme().breakpoints.down("lg"));
  const { setState, setStateWithoutHistory, clearAllSelections } = useArgueActions();

  // Both are only read inside `{leftSidebar && ...}` / `{rightSidebar && ...}` guards below.
  const leftSidebarOpen = useStore((state) => state.leftSidebarOpen);
  const rightSidebarOpen = useStore((state) => state.rightSidebarOpen);

  useEffect(() => {
    setStateWithoutHistory({
      leftSidebarOpen: !isMobile,
      rightSidebarOpen: !isMobile,
    });
  }, [isMobile, setStateWithoutHistory]);

  const setLeftSidebarOpen = (value: boolean) => {
    setState({ leftSidebarOpen: value });
  };

  const setRightSidebarOpen = (value: boolean) => {
    setState({ rightSidebarOpen: value });
  };

  return (
    <Stack direction="row" sx={{ height: "100%", width: "100%" }}>
      {leftSidebar && (
        <Sidebar
          side="left"
          drawerWidth={sidebarWidth}
          isMobile={isMobile}
          isOpen={leftSidebarOpen}
          setIsOpen={setLeftSidebarOpen}
        >
          <Resources
            close={() => {
              setLeftSidebarOpen(false);
            }}
          />
        </Sidebar>
      )}
      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        {header && (
          <Header
            toggleLeft={() => setLeftSidebarOpen(!leftSidebarOpen)}
            toggleRight={() => setRightSidebarOpen(!rightSidebarOpen)}
          />
        )}
        <Box onContextMenu={(e) => e.preventDefault()} sx={{ position: "relative", height: 1 }}>
          <Graph />
        </Box>
      </Stack>
      {rightSidebar && (
        <Sidebar
          side="right"
          drawerWidth={sidebarWidth}
          isMobile={isMobile}
          isOpen={rightSidebarOpen}
          setIsOpen={setRightSidebarOpen}
        >
          <Inspector
            close={() => {
              setRightSidebarOpen(false);
              clearAllSelections();
            }}
          />
        </Sidebar>
      )}
      {assistant && <AssistantPanel options={assistant} />}
    </Stack>
  );
};
