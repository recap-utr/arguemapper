import { Button, Container, Stack, TextField, Typography } from "@mui/material";
import type React from "react";
import { type FallbackProps, getErrorMessage } from "react-error-boundary";
import { PERSIST_KEY } from "@/App.js";
import * as convert from "@/services/convert.js";
import { resetApp } from "@/standalone/ClearCacheButton.js";
import { readState } from "@/store/storage.js";

const FORMATS: readonly [convert.ExportFormat, string][] = [
  ["arguebuf", "Arguebuf"],
  ["aif", "AIF"],
];

/** The stored graph in the export formats that work, as the stored state may be corrupt. */
function backups(): [label: string, json: string][] {
  const persisted = (() => {
    try {
      return readState(PERSIST_KEY);
    } catch {
      return null;
    }
  })();

  if (persisted === null) {
    return [];
  }

  const { graph, analyst } = persisted.state;

  return FORMATS.flatMap(([format, label]) => {
    try {
      return [[label, JSON.stringify(convert.exportGraph(graph, format, analyst))]];
    } catch {
      return [];
    }
  });
}

/** Recovery screen of the standalone app that offers the stored graph for copying. */
export const Recovery: React.FC<FallbackProps> = ({ error }) => (
  <Container sx={{ py: 5 }}>
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Something went wrong</Typography>
        <Typography variant="h6">{getErrorMessage(error) ?? "Unknown error"}</Typography>
      </Stack>
      {backups().map(([label, json]) => (
        <Stack key={label} spacing={1}>
          <Typography variant="h5">{label} export</Typography>
          <Typography>Copy this text to keep your work.</Typography>
          <TextField
            multiline
            maxRows={5}
            fullWidth
            value={json}
            onFocus={(event) => event.target.select()}
            slotProps={{ input: { readOnly: true, sx: { fontFamily: "monospace" } } }}
          />
        </Stack>
      ))}
      <Stack spacing={2}>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reload the page
        </Button>
        <Button variant="outlined" color="error" onClick={resetApp}>
          Reset the app and reload
        </Button>
      </Stack>
    </Stack>
  </Container>
);
