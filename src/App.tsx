import { Box, Stack, useMediaQuery } from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import cytoscape from "cytoscape";
import React, { useCallback, useRef, useState } from "react";
import Cyto from "./components/Cyto";
import Header from "./components/Header";
import Inspector from "./components/Inspector";
import Resources from "./components/Resources";
import Sidebar from "./components/Sidebar";

const drawerWidth = 300;

export default function App() {
  const [leftOpen, setLeftOpen] = useState(false);
  const toggleLeft = () => setLeftOpen(!leftOpen);
  const [rightOpen, setRightOpen] = useState(false);
  const toggleRight = () => setRightOpen(!rightOpen);
  const cy = useRef<null | cytoscape.Core>(null);
  const setCy = useCallback((instance) => (cy.current = instance), []);

  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const [activeResource, setActiveResource] = React.useState("1");

  return (
    <Stack direction="row" sx={{ height: "100vh" }}>
      <Sidebar
        side="left"
        drawerWidth={drawerWidth}
        isMobile={isMobile}
        isOpen={leftOpen}
        setIsOpen={setLeftOpen}
      >
        <Resources
          activeTab={activeResource}
          setActiveTab={setActiveResource}
        />
      </Sidebar>
      <Stack sx={{ flexGrow: 1 }}>
        <Header
          drawerWidth={drawerWidth}
          toggleLeft={toggleLeft}
          toggleRight={toggleRight}
        />
        <Box sx={{ position: "relative", height: 1 }}>
          <Cyto cyCallback={setCy} />
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
        isOpen={rightOpen}
        setIsOpen={setRightOpen}
      >
        <Inspector />
      </Sidebar>
    </Stack>
  );
}
