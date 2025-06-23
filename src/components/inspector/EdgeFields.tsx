import { TextField } from "@mui/material";
import { dequal } from "dequal";
import { produce } from "immer";
import type React from "react";
import { useCallback } from "react";
import type * as model from "../../model.js";
import { type State, setState, useStore } from "../../store.js";

export interface Props extends React.PropsWithChildren {
  idx?: number;
}

export const EdgeFields: React.FC<Props> = ({ idx = 0, children }) => {
  const selectedIndex = useStore((state) => state.selection.edges[idx]);
  const element = useStore(
    (state) => state.edges[selectedIndex] as model.Edge,
    dequal,
  );

  const updateNotes = useCallback((value: string, selectedIndex: number) => {
    setState(
      produce((draft: State) => {
        const edge = draft.edges[selectedIndex];
        if (edge.data === undefined) {
          throw new Error("Edge data is undefined");
        }
        (edge.data.userdata as model.Userdata).notes = value;
      }),
    );
  }, []);

  return (
    <>
      <TextField fullWidth label="ID" value={element.id} disabled />
      <TextField
        fullWidth
        multiline
        minRows={1}
        label="Notes"
        value={(element.data?.userdata as model.Userdata).notes ?? ""}
        onChange={(event) => {
          updateNotes(event.target.value, selectedIndex);
        }}
      />
      {children}
    </>
  );
};

export default EdgeFields;
