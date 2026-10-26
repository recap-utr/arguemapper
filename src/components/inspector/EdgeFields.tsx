import { TextField } from "@mui/material";
import { isEqual } from "es-toolkit";
import type React from "react";
import { useCallback } from "react";
import type * as model from "@/model.js";
import { useArgueActions, useStore } from "@/store.js";
import { NotesField } from "@/components/inspector/NotesField.js";

export interface Props extends React.PropsWithChildren {
  idx?: number;
}

export const EdgeFields: React.FC<Props> = ({ idx = 0, children }) => {
  const selectedIndex = useStore((state) => state.selection.edges[idx]);
  const element = useStore((state) => state.edges[selectedIndex] as model.Edge, isEqual);
  const { mutate } = useArgueActions();

  const updateNotes = useCallback(
    (value: string) => {
      mutate((draft) => {
        const edge = draft.edges[selectedIndex];
        if (edge.data === undefined) {
          throw new Error("Edge data is undefined");
        }
        (edge.data.userdata as model.Userdata).notes = value;
      });
    },
    [selectedIndex, mutate],
  );

  return (
    <>
      <TextField fullWidth label="ID" value={element.id} disabled />
      <NotesField
        value={(element.data?.userdata as model.Userdata | undefined)?.notes ?? ""}
        onChange={updateNotes}
      />
      {children}
    </>
  );
};

export default EdgeFields;
