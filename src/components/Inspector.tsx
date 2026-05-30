import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Stack, Typography } from "@mui/material";
import type React from "react";
import { useCallback } from "react";
import * as model from "../model.js";
import { useArgueActions, useStore } from "../store.js";
import AtomFields from "./inspector/AtomFields.js";
import BulkSchemeFields from "./inspector/BulkSchemeFields.js";
import EdgeFields from "./inspector/EdgeFields.js";
import { NotesField } from "./inspector/NotesField.js";
import SchemeFields from "./inspector/SchemeFields.js";
import { SectionHeader } from "./sidebar/SectionHeader.js";

interface Props {
  onClose: () => void;
}

const Inspector: React.FC<Props> = ({ onClose }) => {
  const selectionType = useStore((state) => state.selection.type);
  const selectedNodes = useStore((state) => state.selection.nodes);
  const nodes = useStore((state) => state.nodes);
  const graphNotes = useStore((state) => (state.graph.userdata as model.Userdata).notes);
  const { setState, mutate } = useArgueActions();

  // Check if all selected nodes are scheme nodes
  const selectedSchemeNodes = selectedNodes
    .map((idx) => nodes[idx])
    .filter((node) => node?.type === "scheme");
  const allSelectedAreSchemes =
    selectedNodes.length > 0 && selectedSchemeNodes.length === selectedNodes.length;

  const onDelete = useCallback(() => {
    setState((state) => ({
      nodes: state.nodes.filter((_node, idx) => !state.selection.nodes.includes(idx)),
      edges: state.edges.filter((_edge, idx) => !state.selection.edges.includes(idx)),
      selection: model.initSelection(),
    }));
  }, [setState]);

  return (
    <>
      <SectionHeader title="Inspector" onClose={onClose} />
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {selectionType === "graph" ? (
          <Stack spacing={2} sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Nothing selected. Double-click an element on the canvas to edit it here.
            </Typography>
            <NotesField
              label="Graph Notes"
              value={graphNotes ?? ""}
              onChange={(value) => {
                mutate((draft) => {
                  (draft.graph.userdata as model.Userdata).notes = value;
                });
              }}
            />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ p: 2 }}>
            {selectionType === "atom" && <AtomFields />}
            {selectionType === "scheme" && <SchemeFields />}
            {selectionType === "edge" && <EdgeFields />}
            {selectionType === "multiple" && allSelectedAreSchemes && <BulkSchemeFields />}
            {selectionType === "multiple" && !allSelectedAreSchemes && (
              <>
                <Typography variant="h6">Multiple elements selected</Typography>
                <Typography variant="body1">
                  Please select only one if you want to edit their values. You can still move
                  multiple elements together in the canvas or delete them.
                </Typography>
              </>
            )}
            <Button
              color="error"
              startIcon={<FontAwesomeIcon icon={faTrash} />}
              variant="contained"
              onClick={onDelete}
            >
              Delete selection
            </Button>
          </Stack>
        )}
      </Box>
    </>
  );
};

export default Inspector;
