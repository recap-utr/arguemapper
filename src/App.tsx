import { Box, Stack, useMediaQuery } from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import cytoscape from "cytoscape";
import React, { useState } from "react";
import Cyto from "./components/Cyto";
import Header from "./components/Header";
import Inspector from "./components/Inspector";
import Resources from "./components/Resources";
import Sidebar from "./components/Sidebar";
import useStore from "./model/appStore";

const drawerWidth = 300;

export default function App() {
  const [cy, setCy] = useState<cytoscape.Core>(null);
  const {
    leftSidebarOpen,
    setLeftSidebarOpen,
    rightSidebarOpen,
    setRightSidebarOpen,
  } = useStore();
  // const setCy = useCallback((instance) => (cy.current = instance), []);

  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const [activeResource, setActiveResource] = React.useState("1");

  return (
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
          <Cyto cy={cy} setCy={setCy} />
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
        <Inspector cy={cy} />
      </Sidebar>
    </Stack>
  );
}
