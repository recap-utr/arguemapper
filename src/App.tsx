import { Box, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { useCallback, useState } from "react";
import { useLocalStorage } from "react-use";
import Graph from "./components/Graph";
import { GraphProvider } from "./components/GraphContext";
import Header from "./components/Header";
import Inspector from "./components/Inspector";
import Resources from "./components/Resources";
import Sidebar from "./components/Sidebar";

const drawerWidth = 300;

export default function App() {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const initialSidebarOpen = isMobile ? false : true;

  const [leftSidebarOpen, setLeftSidebarOpen] =
    useLocalStorage<boolean>("leftSidebarOpen");
  const [rightSidebarOpen, setRightSidebarOpen] =
    useLocalStorage<boolean>("rightSidebarOpen");
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const containerRef = useCallback((node: HTMLElement | null) => {
    if (node !== null) {
      // node.oncontextmenu = () => false;
      setContainer(node);
    }
  }, []);

  return (
    <GraphProvider storageName="graph">
      <Stack direction="row" sx={{ height: "100vh" }}>
        <Sidebar
          side="left"
          drawerWidth={drawerWidth}
          isMobile={isMobile}
          isOpen={leftSidebarOpen ?? initialSidebarOpen}
          setIsOpen={setLeftSidebarOpen}
        >
          <Resources container={container} />
        </Sidebar>
        <Stack sx={{ flexGrow: 1 }}>
          <Header
            toggleLeft={() => setLeftSidebarOpen(!leftSidebarOpen)}
            toggleRight={() => setRightSidebarOpen(!rightSidebarOpen)}
          />
          <Box
            onContextMenu={(e) => e.preventDefault()}
            sx={{ position: "relative", height: 1 }}
          >
            <Graph container={container} containerRef={containerRef} />
          </Box>
        </Stack>
        <Sidebar
          side="right"
          drawerWidth={drawerWidth}
          isMobile={isMobile}
          isOpen={rightSidebarOpen ?? initialSidebarOpen}
          setIsOpen={setRightSidebarOpen}
        >
          <Inspector
            openSidebar={(value) => {
              if (isMobile) {
                setRightSidebarOpen(value);
              }
            }}
          />
        </Sidebar>
      </Stack>
    </GraphProvider>
  );
}
