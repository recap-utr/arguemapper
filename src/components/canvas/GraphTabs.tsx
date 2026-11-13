import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton, Stack, Tab, Typography } from "@mui/material";
import type React from "react";
import { useStore } from "zustand";
import { TabBar } from "@/components/TabBar.js";
import { TooltipIconButton } from "@/components/TooltipIconButton.js";
import * as model from "@/model.js";
import {
  closeDocument,
  type DocumentStore,
  showDocument,
  useArgueActions,
  useArgueConfig,
  useWorkspace,
  useWorkspaceApi,
} from "@/store.js";

/** Tabs of the open graphs above the canvas. */
export const GraphTabs: React.FC = () => {
  const workspace = useWorkspaceApi();
  const documents = useWorkspace((state) => state.documents);
  const active = useWorkspace((state) => state.active);
  const { readOnly } = useArgueConfig();
  const { openGraph } = useArgueActions();

  return (
    <TabBar
      label="Graphs"
      value={active}
      onChange={(id) => showDocument(workspace, id)}
      actions={
        !readOnly && (
          <TooltipIconButton title="New graph" icon={AddIcon} onClick={() => openGraph()} />
        )
      }
    >
      {documents.map((doc) => (
          <Tab
            key={doc.id}
            value={doc.id}
            // a div, since the tab contains the close button
            component="div"
            label={<GraphTabLabel doc={doc} />}
            // a middle click closes the tab like in browsers
            onAuxClick={(event) => event.button === 1 && closeDocument(workspace, doc.id)}
            sx={{ py: 0, pr: 0.5 }}
          />
        ))}
    </TabBar>
  );
};

const GraphTabLabel: React.FC<{ doc: DocumentStore }> = ({ doc }) => {
  const workspace = useWorkspaceApi();
  const title = useStore(doc, (state) => model.graphTitle(state.graph));

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      <Typography variant="inherit" noWrap sx={{ maxWidth: 200 }}>
        {title}
      </Typography>
      <IconButton
        size="small"
        aria-label={`Close ${title}`}
        onClick={(event) => {
          // closing must not show the tab first
          event.stopPropagation();
          closeDocument(workspace, doc.id);
        }}
      >
        <CloseIcon />
      </IconButton>
    </Stack>
  );
};
