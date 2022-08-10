import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, TextField } from "@mui/material";
import produce from "immer";
import React from "react";
import * as model from "../../model";
import useStore, { State } from "../../store";

export interface Props extends React.PropsWithChildren {
  idx?: number;
}

export const AtomFields: React.FC<Props> = ({ idx = 0, children }) => {
  const setState = useStore((state) => state.setState);
  const selectedIndex = useStore((state) => state.selection.nodes[idx]);
  const element = useStore(
    (state) => state.nodes[selectedIndex]
  ) as model.AtomNode;

  return (
    <>
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
                node.data.reference = model.initReference({
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
              draft.graph.majorClaim = element.id;
            })
          );
        }}
      >
        Set as Major Claim
      </Button>
      {children}
    </>
  );
};

export default AtomFields;
