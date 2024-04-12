import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, TextField } from "@mui/material";
import * as arguebuf from "arguebuf";
import { dequal } from "dequal";
import { produce } from "immer";
import React from "react";
import * as model from "../../model.js";
import { State, setState, useStore } from "../../store.js";

export interface Props extends React.PropsWithChildren {
  idx?: number;
}

export const AtomFields: React.FC<Props> = ({ idx = 0, children }) => {
  const selectedIndex = useStore((state) => state.selection.nodes[idx]);
  const element = useStore(
    (state) => state.nodes[selectedIndex] as model.AtomNode,
    dequal
  );
  const majorClaim = useStore((state) => state.graph.majorClaim);

  return (
    <>
      <TextField fullWidth label="ID" value={element.id} disabled />
      <TextField
        fullWidth
        multiline
        minRows={3}
        label="Text"
        value={element.data.text ?? ""}
        onChange={(event) => {
          setState(
            produce((draft: State) => {
              const node = draft.nodes[selectedIndex] as model.AtomNode;
              node.data.text = event.target.value;
            })
          );
        }}
      />
      <TextField
        fullWidth
        multiline
        minRows={3}
        label="Original Text"
        value={element.data.reference?.text ?? ""}
        onChange={(event) => {
          setState(
            produce((draft: State) => {
              const node = draft.nodes[selectedIndex] as model.AtomNode;

              if (node.data.reference === undefined) {
                node.data.reference = new arguebuf.Reference({
                  text: event.target.value,
                });
              } else {
                node.data.reference.text = event.target.value;
              }
            })
          );
        }}
      />
      <Button
        startIcon={<FontAwesomeIcon icon={faCommentDots} />}
        variant="contained"
        onClick={() => {
          setState(
            produce((draft: State) => {
              draft.graph.majorClaim =
                majorClaim !== element.id ? element.id : undefined;
            })
          );
        }}
      >
        {majorClaim !== element.id ? "Set as Major Claim" : "Unset Major Claim"}
      </Button>
      <TextField
        fullWidth
        multiline
        minRows={1}
        label="Notes"
        value={element.data.userdata.notes ?? ""}
        onChange={(event) => {
          setState(
            produce((draft: State) => {
              const node = draft.nodes[selectedIndex];
              node.data.userdata.notes = event.target.value;
            })
          );
        }}
      />
      {children}
    </>
  );
};

export default AtomFields;
