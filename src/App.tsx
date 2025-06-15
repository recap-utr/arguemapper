import { Box, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect } from "react";
import Graph from "./components/Graph.js";
import Header from "./components/Header.js";
import Inspector from "./components/Inspector.js";
import Resources from "./components/Resources.js";
import Sidebar from "./components/Sidebar.js";
import {
  clearAllSelections,
  setState,
  setStateWithoutHistory,
  useStore,
} from "./store.js";

// https://dev.to/maciejtrzcinski/100vh-problem-with-ios-safari-3ge9

export default function App() {
  const sidebarWidth = useStore((state) => state.sidebarWidth);
  const isMobile = useMediaQuery(useTheme().breakpoints.down("lg"));

  const leftSidebarOpen = useStore((state) => state.leftSidebarOpen);
  const rightSidebarOpen = useStore((state) => state.rightSidebarOpen);

  useEffect(() => {
    setStateWithoutHistory({
      leftSidebarOpen: !isMobile,
      rightSidebarOpen: !isMobile,
    });
  }, [isMobile]);

  const setLeftSidebarOpen = (value: boolean) => {
    setState({ leftSidebarOpen: value });
  };

  const setRightSidebarOpen = (value: boolean) => {
    setState({ rightSidebarOpen: value });
  };

  return (
    <Stack direction="row" sx={{ height: "100vh" }}>
      <Sidebar
        side="left"
        drawerWidth={sidebarWidth}
        isMobile={isMobile}
        isOpen={leftSidebarOpen}
        setIsOpen={setLeftSidebarOpen}
      >
        <Resources />
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
          <Graph />
        </Box>
      </Stack>
      <Sidebar
        side="right"
        drawerWidth={sidebarWidth}
        isMobile={isMobile}
        isOpen={rightSidebarOpen}
        setIsOpen={setRightSidebarOpen}
      >
        <Inspector
          close={() => {
            if (isMobile) {
              setRightSidebarOpen(false);
            }
            clearAllSelections();
          }}
        />
      </Sidebar>
    </Stack>
  );
}
