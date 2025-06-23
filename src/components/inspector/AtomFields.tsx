import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, TextField } from "@mui/material";
import * as arguebuf from "arguebuf";
import { dequal } from "dequal";
import { produce } from "immer";
import type React from "react";
import { useCallback } from "react";
import type * as model from "../../model.js";
import { type State, setState, useStore } from "../../store.js";

export interface Props extends React.PropsWithChildren {
  idx?: number;
}

export const AtomFields: React.FC<Props> = ({ idx = 0, children }) => {
  const selectedIndex = useStore((state) => state.selection.nodes[idx]);
  const element = useStore(
    (state) => state.nodes[selectedIndex] as model.AtomNode,
    dequal,
  );
  const userdata = element.data.userdata as model.Userdata;
  const majorClaim = useStore((state) => state.graph.majorClaim);

  const updateText = useCallback((value: string, selectedIndex: number) => {
    setState(
      produce((draft: State) => {
        const node = draft.nodes[selectedIndex] as model.AtomNode;
        node.data.text = value;
      }),
    );
  }, []);

  const updateReference = useCallback(
    (value: string, selectedIndex: number) => {
      setState(
        produce((draft: State) => {
          const node = draft.nodes[selectedIndex] as model.AtomNode;
          if (node.data.reference === undefined) {
            node.data.reference = new arguebuf.Reference({
              text: value,
            });
          } else {
            node.data.reference.text = value;
          }
        }),
      );
    },
    [],
  );

  const updateNotes = useCallback((value: string, selectedIndex: number) => {
    setState(
      produce((draft: State) => {
        const node = draft.nodes[selectedIndex];
        (node.data.userdata as model.Userdata).notes = value;
      }),
    );
  }, []);

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
          updateText(event.target.value, selectedIndex);
        }}
      />
      <TextField
        fullWidth
        multiline
        minRows={3}
        label="Original Text"
        value={element.data.reference?.text ?? ""}
        onChange={(event) => {
          updateReference(event.target.value, selectedIndex);
        }}
      />
      {userdata.assistant && (
        <TextField
          fullWidth
          multiline
          label="Assistant Explanation"
          InputProps={{
            readOnly: true,
          }}
          value={userdata.assistant.explanation ?? ""}
        />
      )}
      {userdata.assistant?.mcExplanation && (
        <TextField
          fullWidth
          multiline
          label="Assistant Major Claim Explanation"
          InputProps={{
            readOnly: true,
          }}
          value={userdata.assistant.mcExplanation}
        />
      )}
      <Button
        startIcon={<FontAwesomeIcon icon={faCommentDots} />}
        variant="contained"
        onClick={() => {
          setState(
            produce((draft: State) => {
              draft.graph.majorClaim =
                majorClaim !== element.id ? element.id : undefined;
            }),
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
        value={userdata.notes ?? ""}
        onChange={(event) => {
          updateNotes(event.target.value, selectedIndex);
        }}
      />
      {children}
    </>
  );
};

export default AtomFields;
