import { faCloudArrowDown } from "@fortawesome/free-solid-svg-icons";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import type React from "react";
import { useState } from "react";
import { IconMenuItem } from "@/components/IconMenuItem.js";
import { useReplaceGraph } from "@/components/useReplaceGraph.js";

/** Standalone-only file menu entry: opens an argument map of aifdb.org via the dev/server proxy. */
export const AifdbImport: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [aifdbId, setAifdbId] = useState("");
  const replaceGraph = useReplaceGraph();

  const handleImport = async () => {
    const response = await fetch(`/api/aifdb/json/${aifdbId}`);

    if (!response.ok) {
      enqueueSnackbar(
        `Failed to fetch map ${aifdbId} from AIFdb.org: ${response.statusText} (${response.status})`,
        { variant: "error" },
      );

      return;
    }

    replaceGraph(await response.json());
    setOpen(false);
    setAifdbId("");
  };

  return (
    <>
      <IconMenuItem icon={faCloudArrowDown} text="Open from AIFdb…" onClick={() => setOpen(true)} />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Open from AIFdb</DialogTitle>
        <DialogContent>
          <TextField
            label="Map ID"
            type="number"
            fullWidth
            margin="dense"
            value={aifdbId}
            onChange={(event) => setAifdbId(event.target.value)}
            helperText="The numeric ID of an argument map on aifdb.org"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={aifdbId === ""} onClick={() => void handleImport()}>
            Open
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
