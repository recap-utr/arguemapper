import { Box, Stack } from "@mui/material";
import type React from "react";
import { useEffect } from "react";
import { GraphTabs } from "@/components/canvas/GraphTabs.js";
import Graph from "@/components/Graph.js";
import Inspector from "@/components/inspector/Inspector.js";
import { Assistant } from "@/components/panels/Assistant.js";
import { usePanelLayout } from "@/components/panels/layout.js";
import { PanelArea } from "@/components/panels/PanelArea.js";
import { TextPane } from "@/components/panels/TextPane.js";
import {
  type Panel,
  useArgueActions,
  useArgueConfig,
  useDocumentApi,
  useWorkspace,
} from "@/store.js";

/**
 * Internal layout: the canvas with the text panel on its left and the details on its right.
 * Narrow screens show one panel at a time below the canvas instead, with the same components.
 * The canvas and the panels of the graph are remounted for each graph, the assistant is shared.
 */
export const GraphEditorLayout: React.FC = () => {
  const { panels } = useArgueConfig();
  const tabs = useWorkspace((state) => state.tabs);
  const { wide, areas } = usePanelLayout();
  const { closePanels } = useArgueActions();
  const { id } = useDocumentApi();

  // Panels below the canvas cover half of it, so narrow editors start with none.
  useEffect(() => {
    if (!wide) closePanels("text", "inspector", "assistant");
  }, [wide, closePanels]);

  const render = (panel: Panel): React.ReactNode => {
    switch (panel) {
      case "text":
        return <TextPane key={id} />;
      case "inspector":
        return <Inspector key={id} />;
      case "assistant":
        return <Assistant />;
    }
  };

  // the canvas keeps its position among the children, so resizing does not remount it
  return (
    <Stack direction={wide ? "row" : "column"} sx={{ height: 1, width: 1 }}>
      {panels && wide && <PanelArea area={areas[0]} placement="left" render={render} />}
      <Stack sx={{ flex: "1 1 0", minWidth: 0, minHeight: 0 }}>
        {tabs && <GraphTabs />}
        <Box sx={{ position: "relative", flex: "1 1 0", minHeight: 0 }}>
          <Graph key={id} />
        </Box>
      </Stack>
      {panels && (
        <PanelArea
          area={areas.at(-1) ?? []}
          placement={wide ? "right" : "bottom"}
          render={render}
        />
      )}
    </Stack>
  );
};
