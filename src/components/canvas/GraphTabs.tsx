import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton, Stack, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import type React from "react";
import { useStore } from "zustand";
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
    <Stack direction="row" sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        aria-label="Graphs"
        value={active}
        onChange={(_event, id: string) => showDocument(workspace, id)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ flexGrow: 1, minHeight: 40 }}
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
            sx={{ minHeight: 40, py: 0, pr: 0.5, textTransform: "none" }}
          />
        ))}
      </Tabs>
      {!readOnly && (
        <Tooltip title="New graph">
          <IconButton onClick={() => openGraph()}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
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
