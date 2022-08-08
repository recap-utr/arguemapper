import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, TextField } from "@mui/material";
import produce from "immer";
import React from "react";
import * as model from "../../model";
import { useGraph } from "../GraphContext";

export interface Props extends React.PropsWithChildren {
  idx?: number;
}

export const AtomFields: React.FC<Props> = ({ idx = 0, children }) => {
  const { selection, setState, setSelection } = useGraph();
  const element = selection.nodes[idx] as model.AtomNode;

  return (
    <>
      <TextField
        fullWidth
        multiline
        minRows={3}
        label="Text"
        onBlur={() => {
          setState(
            produce((draft) => {
              const idx = draft.nodes.findIndex(
                (node) => node.id === element.id
              );
              draft.nodes[idx] = element;
            })
          );
        }}
        value={element.data.text}
        onChange={(event) => {
          setSelection(
            produce((draft) => {
              const node = draft.nodes[idx] as model.AtomNode;
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
        onBlur={() => {
          setState(
            produce((draft) => {
              const idx = draft.nodes.findIndex(
                (node) => node.id === element.id
              );
              draft.nodes[idx] = element;
            })
          );
        }}
        value={element.data.reference?.text}
        onChange={(event) => {
          setSelection(
            produce((draft) => {
              const node = draft.nodes[idx] as model.AtomNode;

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
            produce((draft) => {
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
