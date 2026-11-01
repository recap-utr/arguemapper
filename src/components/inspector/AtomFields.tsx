import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, TextField } from "@mui/material";
import * as arguebuf from "arguebuf";
import type React from "react";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useStore } from "@/store.js";
import { ExplanationField } from "@/components/inspector/ExplanationField.js";
import { NotesField } from "@/components/inspector/NotesField.js";

export const AtomFields: React.FC<React.PropsWithChildren> = ({ children }) => {
  const id = useStore((state) => state.selection.nodes[0]);
  const atom = useStore((state) => state.graph.nodes[id]);
  const majorClaim = useStore((state) => state.graph.majorClaim);
  const { readOnly } = useArgueConfig();
  const { editGraph } = useArgueActions();

  if (atom?.type !== "atom") {
    return null;
  }

  const update = (changes: (current: model.AtomNode, graph: model.Graph) => arguebuf.AtomChanges<model.NodeUserdata>) =>
    editGraph((graph) => {
      const current = graph.nodes[id];

      if (current?.type === "atom") {
        graph.updateAtom(id, changes(current, graph));
      }
    });

  return (
    <>
      <TextField fullWidth label="ID" value={atom.id} disabled />
      <TextField
        slotProps={{ input: { readOnly } }}
        fullWidth
        multiline
        minRows={3}
        label="Text"
        value={atom.text}
        onChange={(event) => {
          const text = event.target.value;
          update(() => ({ text }));
        }}
      />
      <TextField
        slotProps={{ input: { readOnly } }}
        fullWidth
        multiline
        minRows={3}
        label="Original Text"
        value={atom.reference?.text ?? ""}
        onChange={(event) => {
          const text = event.target.value;
          update((current, graph) => {
            const resource = current.reference?.resource;
            const source = resource === undefined ? "" : graph.resources[resource].text;
            const index = text === "" ? -1 : source.indexOf(text);
            // the offset is only kept for verbatim matches, as the user is still typing
            return {
              reference: new arguebuf.Reference({
                text,
                resource,
                offset: index === -1 ? undefined : index,
              }),
            };
          });
        }}
      />
      <ExplanationField node={atom} />
      <Button
        disabled={readOnly}
        startIcon={<FontAwesomeIcon icon={faCommentDots} />}
        variant="contained"
        onClick={() => {
          editGraph((graph) => model.toggleMajorClaim(graph, id));
        }}
      >
        {majorClaim === id ? "Unset Major Claim" : "Set as Major Claim"}
      </Button>
      <NotesField
        value={atom.userdata.notes ?? ""}
        onChange={(value) => {
          update((current) => ({ userdata: { ...current.userdata, notes: value } }));
        }}
      />
      {children}
    </>
  );
};

export default AtomFields;
