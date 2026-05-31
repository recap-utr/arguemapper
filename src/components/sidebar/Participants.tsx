import { faMinusCircle, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import * as arguebuf from "arguebuf";
import type React from "react";
import { useArgueActions, useStore } from "@/store.js";
import { SectionHeader } from "@/components/sidebar/SectionHeader.js";

interface Props {
  onClose: () => void;
}

export const Participants: React.FC<Props> = ({ onClose }) => {
  const participants = useStore((state) => state.graph.participants);
  const { mutate } = useArgueActions();

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
            startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
            variant="contained"
            onClick={() => {
              mutate((draft) => {
                draft.graph.addParticipant(new arguebuf.Participant({ name: "Unknown" }));
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
  const { mutate } = useArgueActions();

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <TextField
          fullWidth
          label="Name"
          value={participant.name}
          onChange={(event) => {
            mutate((draft) => {
              draft.graph.participants[id].name = event.target.value;
            });
          }}
        />
        <TextField
          fullWidth
          type="email"
          label="Email"
          value={participant.email}
          onChange={(event) => {
            mutate((draft) => {
              draft.graph.participants[id].email = event.target.value;
            });
          }}
        />
        <TextField
          fullWidth
          label="Username"
          value={participant.username}
          onChange={(event) => {
            mutate((draft) => {
              draft.graph.participants[id].username = event.target.value;
            });
          }}
        />
        <Button
          startIcon={<FontAwesomeIcon icon={faMinusCircle} />}
          color="error"
          variant="contained"
          onClick={() => {
            mutate((draft) => {
              delete draft.graph.participants[id];
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
