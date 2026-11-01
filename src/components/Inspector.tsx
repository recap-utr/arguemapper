import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Stack, Typography } from "@mui/material";
import type React from "react";
import { useCallback } from "react";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useStore } from "@/store.js";
import AtomFields from "@/components/inspector/AtomFields.js";
import EdgeFields from "@/components/inspector/EdgeFields.js";
import { NotesField } from "@/components/inspector/NotesField.js";
import SchemeFields from "@/components/inspector/SchemeFields.js";
import { SectionHeader } from "@/components/sidebar/SectionHeader.js";

interface Props {
  onClose: () => void;
}

const Inspector: React.FC<Props> = ({ onClose }) => {
  const selectionType = useStore((state) => model.selectionType(state.graph, state.selection));
  const allSelectedAreSchemes = useStore(
    ({ graph, selection }) =>
      selection.nodes.length > 0 &&
      selection.nodes.every((id) => graph.nodes[id]?.type === "scheme"),
  );
  const graphNotes = useStore((state) => state.graph.userdata.notes);
  const { readOnly } = useArgueConfig();
  const { editGraph } = useArgueActions();

  const onDelete = useCallback(() => {
    editGraph((graph, { selection }) => {
      model.removeElements(graph, selection);

      return { selection: model.emptySelection };
    });
  }, [editGraph]);

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
                editGraph((graph) => {
                  graph.userdata = { ...graph.userdata, notes: value };
                });
              }}
            />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ p: 2 }}>
            {selectionType === "atom" && <AtomFields />}
            {(selectionType === "scheme" || allSelectedAreSchemes) && <SchemeFields />}
            {selectionType === "edge" && <EdgeFields />}
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
              disabled={readOnly}
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
