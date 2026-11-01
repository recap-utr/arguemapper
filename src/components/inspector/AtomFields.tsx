import { faQuoteLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type * as arguebuf from "arguebuf";
import type React from "react";
import { AdvancedSection } from "@/components/inspector/AdvancedSection.js";
import { ExplanationField } from "@/components/inspector/ExplanationField.js";
import { NotesField } from "@/components/inspector/NotesField.js";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useStore } from "@/store.js";

/** Fields of the selected atom node. */
export const AtomFields: React.FC = () => {
  const id = useStore((state) => state.selection.nodes[0]);
  const atom = useStore((state) => state.graph.nodes[id]);
  const isMajorClaim = useStore((state) => state.graph.majorClaim === id);
  const participants = useStore((state) => state.graph.participants);
  const hasText = useStore((state) => Object.keys(state.graph.resources).length > 0);
  const { readOnly, panels } = useArgueConfig();
  const { editGraph, openPanel } = useArgueActions();

  if (atom?.type !== "atom") {
    return null;
  }

  const update = (changes: (current: model.AtomNode) => arguebuf.AtomChanges<model.NodeUserdata>) =>
    editGraph((graph) => {
      const current = graph.nodes[id];

      if (current?.type === "atom") {
        graph.updateAtom(id, changes(current));
      }
    });

  return (
    <>
      <Typography variant="overline">Claim</Typography>
      <TextField
        slotProps={{ input: { readOnly } }}
        fullWidth
        multiline
        minRows={3}
        label="Text"
        helperText="The claim in your own words"
        value={atom.text}
        onChange={(event) => {
          const text = event.target.value;
          update(() => ({ text }));
        }}
      />
      {atom.reference ? (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Quote from the text
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              {atom.reference.text}
            </Typography>
            {panels && (
              <Button
                size="small"
                startIcon={<FontAwesomeIcon icon={faQuoteLeft} />}
                onClick={() => openPanel("text")}
                sx={{ alignSelf: "flex-start" }}
              >
                Show in text
              </Button>
            )}
          </Stack>
        </Paper>
      ) : (
        hasText &&
        !readOnly && (
          <Typography variant="body2" color="text.secondary">
            To link this claim to the text, select a passage there and choose “Use as quote”.
          </Typography>
        )
      )}
      <FormControlLabel
        disabled={readOnly}
        control={
          <Switch
            checked={isMajorClaim}
            onChange={() => editGraph((graph) => model.toggleMajorClaim(graph, id))}
          />
        }
        label="Main claim, the conclusion of the whole text"
      />
      <AdvancedSection id={atom.id}>
        <ExplanationField node={atom} />
        <NotesField
          value={atom.userdata.notes ?? ""}
          onChange={(notes) => editGraph((graph) => model.setNotes(graph, id, notes))}
        />
        {Object.keys(participants).length > 0 && (
          <TextField
            select
            label="Author"
            disabled={readOnly}
            value={atom.participant ?? ""}
            onChange={(event) => {
              const { value } = event.target;
              update(() => ({ participant: value === "" ? undefined : value }));
            }}
          >
            <MenuItem value="">Unknown</MenuItem>
            {Object.values(participants).map((participant) => (
              <MenuItem key={participant.id} value={participant.id}>
                {participant.name}
              </MenuItem>
            ))}
          </TextField>
        )}
      </AdvancedSection>
    </>
  );
};

