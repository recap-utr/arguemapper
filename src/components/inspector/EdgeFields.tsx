import { Typography } from "@mui/material";
import type React from "react";
import { AdvancedSection } from "@/components/inspector/AdvancedSection.js";
import { NotesField } from "@/components/inspector/NotesField.js";
import * as model from "@/model.js";
import { useArgueActions, useDocument } from "@/store.js";

/** Fields of the selected edge. */
export const EdgeFields: React.FC = () => {
  const id = useDocument((state) => state.selection.edges[0]);
  const edge = useDocument((state) => state.graph.edges[id]);
  const { editGraph } = useArgueActions();

  return (
    <>
      <Typography variant="overline">Connection</Typography>
      <AdvancedSection id={edge.id}>
        <NotesField
          value={edge.userdata.notes ?? ""}
          onChange={(notes) => editGraph((graph) => model.setNotes(graph, id, notes))}
        />
      </AdvancedSection>
    </>
  );
};
