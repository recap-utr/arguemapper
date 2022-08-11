import { Box, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLayoutEffect, useState } from "react";
import { useStore as useFlowStore } from "react-flow-renderer";
import Graph from "./components/Graph";
import Header from "./components/Header";
import Inspector from "./components/Inspector";
import Resources from "./components/Resources";
import Sidebar from "./components/Sidebar";
import useStore from "./store";

const drawerWidth = 300;

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

// https://dev.to/maciejtrzcinski/100vh-problem-with-ios-safari-3ge9

export default function App() {
  const setState = useStore((state) => state.setState);
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const initialSidebarOpen = isMobile ? false : true;
  const [, windowHeight] = useWindowSize();

  const _leftSidebarOpen = useStore((state) => state.leftSidebarOpen);
  const _rightSidebarOpen = useStore((state) => state.rightSidebarOpen);
  const leftSidebarOpen =
    _leftSidebarOpen === undefined ? initialSidebarOpen : _leftSidebarOpen;
  const rightSidebarOpen =
    _rightSidebarOpen === undefined ? initialSidebarOpen : _rightSidebarOpen;

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
    <Stack direction="row" sx={{ height: windowHeight }}>
      <Sidebar
        side="left"
        drawerWidth={drawerWidth}
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
        drawerWidth={drawerWidth}
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
