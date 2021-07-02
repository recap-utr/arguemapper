import { Box, Stack, useMediaQuery } from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import React from "react";
import { useLocalStorage } from "react-use";
import Cyto from "./components/Cyto";
import { GraphProvider } from "./components/GraphContext";
import Header from "./components/Header";
import Inspector from "./components/Inspector";
import Resources from "./components/Resources";
import Sidebar from "./components/Sidebar";

const drawerWidth = 300;

export default function App() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useLocalStorage(
    "leftSidebarOpen",
    true
  );
  const [rightSidebarOpen, setRightSidebarOpen] = useLocalStorage(
    "rightSidebarOpen",
    true
  );

  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const [activeResource, setActiveResource] = React.useState("1");

  return (
    <GraphProvider>
      <Stack direction="row" sx={{ height: "100vh" }}>
        <Sidebar
          side="left"
          drawerWidth={drawerWidth}
          isMobile={isMobile}
          isOpen={leftSidebarOpen}
          setIsOpen={setLeftSidebarOpen}
        >
          <Resources
            activeTab={activeResource}
            setActiveTab={setActiveResource}
          />
        </Sidebar>
        <Stack sx={{ flexGrow: 1 }}>
          <Header
            drawerWidth={drawerWidth}
            toggleLeft={() => setLeftSidebarOpen(!leftSidebarOpen)}
            toggleRight={() => setRightSidebarOpen(!rightSidebarOpen)}
          />
          <Box sx={{ position: "relative", height: 1 }}>
            <Cyto />
          </Box>
          {/* <Box sx={{ position: "relative", height: 1 }}>
          <ReactFlowProvider>
            <Graph />
          </ReactFlowProvider>
        </Box> */}
        </Stack>
        <Sidebar
          side="right"
          drawerWidth={drawerWidth}
          isMobile={isMobile}
          isOpen={rightSidebarOpen}
          setIsOpen={setRightSidebarOpen}
        >
          <Inspector />
        </Sidebar>
      </Stack>
    </GraphProvider>
  );
}