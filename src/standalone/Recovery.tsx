import { Button, Container, Stack, TextField, Typography } from "@mui/material";
import type React from "react";
import { Suspense, use } from "react";
import type { FallbackProps } from "react-error-boundary";
import { describeError } from "@/model.js";
import { PERSIST_KEY, resetApp } from "@/standalone/storage.js";
import { type GraphRecord, readBackups } from "@/store.js";

// read once, as the stored state does not change while the app is broken
let backups: Promise<GraphRecord[]> | undefined;

/** The stored graphs as arguebuf JSON, which is what the app exports. */
const Backups: React.FC = () => {
  backups ??= readBackups(PERSIST_KEY).catch(() => []);

  return use(backups).map(({ graph, name }, index) => (
    <Stack key={index} spacing={1}>
      <Typography variant="h5">{name ?? `Graph ${index + 1}`}</Typography>
      <Typography>Copy this text and save it as a JSON file to keep your work.</Typography>
      <TextField
        multiline
        maxRows={5}
        fullWidth
        value={JSON.stringify(graph)}
        onFocus={(event) => event.target.select()}
        slotProps={{ input: { readOnly: true, sx: { fontFamily: "monospace" } } }}
      />
    </Stack>
  ));
};

/** Recovery screen of the standalone app that offers the stored graphs for copying. */
export const Recovery: React.FC<FallbackProps> = ({ error }) => (
  <Container sx={{ py: 5 }}>
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Something went wrong</Typography>
        <Typography variant="h6">{describeError(error)}</Typography>
      </Stack>
      <Suspense>
        <Backups />
      </Suspense>
      <Stack spacing={2}>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reload the page
        </Button>
        <Button variant="outlined" color="error" onClick={() => void resetApp()}>
          Reset the app and reload
        </Button>
      </Stack>
    </Stack>
  </Container>
);
