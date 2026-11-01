import { Typography } from "@mui/material";
import type React from "react";
import { AdvancedSection } from "@/components/inspector/AdvancedSection.js";
import { NotesField } from "@/components/inspector/NotesField.js";
import * as model from "@/model.js";
import { useArgueActions, useStore } from "@/store.js";

/** Fields of the selected edge. */
export const EdgeFields: React.FC = () => {
  const id = useStore((state) => state.selection.edges[0]);
  const edge = useStore((state) => state.graph.edges[id]);
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

