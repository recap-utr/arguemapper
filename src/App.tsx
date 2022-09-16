import { Box, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect } from "react";
import { useStore as useFlowStore } from "reactflow";
import Graph from "./components/Graph";
import Header from "./components/Header";
import Inspector from "./components/Inspector";
import Resources from "./components/Resources";
import Sidebar from "./components/Sidebar";
import useStore from "./store";

// https://dev.to/maciejtrzcinski/100vh-problem-with-ios-safari-3ge9

export default function App() {
  const setState = useStore((state) => state.setState);
  const sidebarWidth = useStore((state) => state.sidebarWidth);
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));

  const leftSidebarOpen = useStore((state) => state.leftSidebarOpen);
  const rightSidebarOpen = useStore((state) => state.rightSidebarOpen);

  useEffect(() => {
    setState({ leftSidebarOpen: !isMobile, rightSidebarOpen: !isMobile });
  }, [setState, isMobile]);

  const setLeftSidebarOpen = (value: boolean) => {
    setState({ leftSidebarOpen: value });
  };

  const setRightSidebarOpen = (value: boolean) => {
    setState({ rightSidebarOpen: value });
  };

  const resetSelectedElements = useFlowStore(
    (state) => state.resetSelectedElements
  );

  return (
    <Stack direction="row" sx={{ height: "100vh" }}>
      <Sidebar
        side="left"
        drawerWidth={sidebarWidth}
        isMobile={isMobile}
        isOpen={leftSidebarOpen!}
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
        isOpen={rightSidebarOpen!}
        setIsOpen={setRightSidebarOpen}
      >
        <Inspector
          close={() => {
            if (isMobile) {
              setRightSidebarOpen(false);
            }
            resetSelectedElements();
          }}
        />
      </Sidebar>
    </Stack>
  );
}
