import { TextField } from "@mui/material";
import type React from "react";
import { useArgueActions, useStore } from "@/store.js";
import { NotesField } from "@/components/inspector/NotesField.js";

export const EdgeFields: React.FC<React.PropsWithChildren> = ({ children }) => {
  const id = useStore((state) => state.selection.edges[0]);
  const edge = useStore((state) => state.graph.edges[id]);
  const { editGraph } = useArgueActions();

  return (
    <>
      <TextField fullWidth label="ID" value={edge.id} disabled />
      <NotesField
        value={edge.userdata.notes ?? ""}
        onChange={(value) => {
          editGraph((graph) => {
            graph.updateEdge(id, { userdata: { ...graph.edges[id].userdata, notes: value } });
          });
        }}
      />
      {children}
    </>
  );
};

export default EdgeFields;
