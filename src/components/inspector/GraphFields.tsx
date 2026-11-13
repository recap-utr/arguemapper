import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button, Paper, Stack, TextField, Typography } from "@mui/material";
import * as arguebuf from "arguebuf";
import type React from "react";
import { AdvancedSection } from "@/components/inspector/AdvancedSection.js";
import { NotesField } from "@/components/inspector/NotesField.js";
import { TooltipIconButton } from "@/components/TooltipIconButton.js";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useDocument } from "@/store.js";

/** Fields of the whole graph, shown while nothing is selected. */
export const GraphFields: React.FC = () => {
  const name = useDocument((state) => state.graph.name);
  const notes = useDocument((state) => state.graph.userdata.notes);
  const participants = useDocument((state) => state.graph.participants);
  const { readOnly } = useArgueConfig();
  const { editGraph } = useArgueActions();

  return (
    <>
      <Typography color="text.secondary">
        Select a claim or relation on the canvas to edit it here.
      </Typography>
      <Typography variant="overline">Graph</Typography>
      <TextField
        label="Name"
        fullWidth
        value={name ?? ""}
        slotProps={{ input: { readOnly } }}
        onChange={(event) => {
          const { value } = event.target;
          editGraph((graph) => {
            graph.name = value || undefined;
          });
        }}
      />
      <NotesField
        value={notes ?? ""}
        onChange={(value) => editGraph((graph) => model.setNotes(graph, undefined, value))}
      />
      <AdvancedSection title={`Authors (${Object.keys(participants).length})`}>
        {Object.values(participants).map((participant) => (
          <ParticipantFields key={participant.id} participant={participant} />
        ))}
        {!readOnly && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              editGraph((graph) => {
                graph.addParticipant(new arguebuf.Participant({ name: "" }));
              });
            }}
          >
            Add author
          </Button>
        )}
      </AdvancedSection>
    </>
  );
};

const ParticipantFields: React.FC<{ participant: arguebuf.Participant }> = ({ participant }) => {
  const { readOnly } = useArgueConfig();
  const { editGraph } = useArgueActions();

  const field = (key: "name" | "email" | "username", label: string) => (
    <TextField
      size="small"
      fullWidth
      label={label}
      slotProps={{ input: { readOnly } }}
      value={participant[key] ?? ""}
      onChange={(event) => {
        const { value } = event.target;
        editGraph((graph) => {
          graph.updateParticipant(participant.id, { [key]: value });
        });
      }}
    />
  );

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {field("name", "Name")}
          {!readOnly && (
            <TooltipIconButton
              title="Remove author"
              icon={DeleteIcon}
              color="error"
              onClick={() => {
                editGraph((graph) => {
                  graph.removeParticipant(participant.id);
                });
              }}
            />
          )}
        </Stack>
        {field("email", "Email")}
        {field("username", "Username")}
      </Stack>
    </Paper>
  );
};
