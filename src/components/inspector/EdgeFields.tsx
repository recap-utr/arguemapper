import { TextField } from "@mui/material";
import { dequal } from "dequal";
import produce from "immer";
import React from "react";
import * as model from "../../model";
import useStore, { State } from "../../store";

export interface Props extends React.PropsWithChildren {
  idx?: number;
}

export const EdgeFields: React.FC<Props> = ({ idx = 0, children }) => {
  const setState = useStore((state) => state.setState);
  const selectedIndex = useStore((state) => state.selection.edges[idx]);
  const element = useStore(
    (state) => state.edges[selectedIndex] as model.Edge,
    dequal
  );

  return (
    <>
      <TextField
        fullWidth
        multiline
        minRows={1}
        label="Notes"
        value={element.data?.userdata?.notes ?? ""}
        onChange={(event) => {
          setState(
            produce((draft: State) => {
              const edge = draft.edges[selectedIndex];

              if (edge.data === undefined) {
                edge.data = { metadata: model.initMetadata({}), userdata: {} };
              }

              edge.data.userdata.notes = event.target.value;
            })
          );
        }}
      />
      {children}
    </>
  );
};

export default EdgeFields;
