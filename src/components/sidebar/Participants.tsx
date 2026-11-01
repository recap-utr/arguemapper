import { faMinusCircle, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import * as arguebuf from "arguebuf";
import type React from "react";
import { useArgueActions, useArgueConfig, useStore } from "@/store.js";
import { SectionHeader } from "@/components/sidebar/SectionHeader.js";

interface Props {
  onClose: () => void;
}

export const Participants: React.FC<Props> = ({ onClose }) => {
  const participants = useStore((state) => state.graph.participants);
  const { readOnly } = useArgueConfig();
  const { editGraph } = useArgueActions();

  return (
    <>
      <SectionHeader title="Participants" onClose={onClose} />
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
        <Stack spacing={2}>
          {Object.entries(participants).map(([id, participant]) => (
            <ParticipantCard key={id} id={id} participant={participant} />
          ))}
          {Object.keys(participants).length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No participants yet.
            </Typography>
          )}
          <Button
            disabled={readOnly}
            startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
            variant="contained"
            onClick={() => {
              editGraph((graph) => {
                graph.addParticipant(new arguebuf.Participant({ name: "Unknown" }));
              });
            }}
          >
            Add Participant
          </Button>
        </Stack>
      </Box>
    </>
  );
};

interface CardProps {
  id: string;
  participant: arguebuf.Participant;
}

const ParticipantCard: React.FC<CardProps> = ({ id, participant }) => {
  const { readOnly } = useArgueConfig();
  const { editGraph } = useArgueActions();

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <TextField
          slotProps={{ input: { readOnly } }}
          fullWidth
          label="Name"
          value={participant.name}
          onChange={(event) => {
            const { value } = event.target;
            editGraph((graph) => {
              graph.updateParticipant(id, { name: value });
            });
          }}
        />
        <TextField
          slotProps={{ input: { readOnly } }}
          fullWidth
          type="email"
          label="Email"
          value={participant.email}
          onChange={(event) => {
            const { value } = event.target;
            editGraph((graph) => {
              graph.updateParticipant(id, { email: value });
            });
          }}
        />
        <TextField
          slotProps={{ input: { readOnly } }}
          fullWidth
          label="Username"
          value={participant.username}
          onChange={(event) => {
            const { value } = event.target;
            editGraph((graph) => {
              graph.updateParticipant(id, { username: value });
            });
          }}
        />
        <Button
          disabled={readOnly}
          startIcon={<FontAwesomeIcon icon={faMinusCircle} />}
          color="error"
          variant="contained"
          onClick={() => {
            editGraph((graph) => {
              graph.removeParticipant(id);
            });
          }}
        >
          Remove Participant
        </Button>
      </Stack>
    </Paper>
  );
};

export default Participants;
