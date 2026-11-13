import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { TextField } from "@mui/material";
import type * as arguebuf from "arguebuf";
import type React from "react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog.js";
import { IconMenuItem } from "@/components/IconMenuItem.js";
import { describeError } from "@/model.js";
import { useArgueActions } from "@/store.js";

/** The argument map with the id on aifdb.org, fetched via the dev/server proxy. */
async function fetchMap(id: string): Promise<arguebuf.load.JsonGraph> {
  const response = await fetch(`/api/aifdb/json/${id}`);

  if (!response.ok) {
    throw new Error(`${response.statusText} (${response.status})`);
  }

  return response.json();
}

/** Standalone-only file menu entry that opens an argument map of aifdb.org. */
export const AifdbImport: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [aifdbId, setAifdbId] = useState("");
  const { notify, openGraph } = useArgueActions();

  const handleImport = () =>
    fetchMap(aifdbId).then(
      (map) => {
        openGraph(map);
        setAifdbId("");
      },
      (error: unknown) =>
        notify(`Failed to fetch map ${aifdbId} from AIFdb.org: ${describeError(error)}`, "error"),
    );

  return (
    <>
      <IconMenuItem
        icon={CloudDownloadIcon}
        text="Open from AIFdb…"
        onClick={() => setOpen(true)}
      />
      <ConfirmDialog
        open={open}
        title="Open from AIFdb"
        description="Enter the numeric ID of an argument map on aifdb.org."
        confirmText="Open"
        confirmDisabled={aifdbId === ""}
        onConfirm={() => void handleImport()}
        onClose={() => setOpen(false)}
      >
        <TextField
          label="Map ID"
          type="number"
          value={aifdbId}
          onChange={(event) => setAifdbId(event.target.value)}
        />
      </ConfirmDialog>
    </>
  );
};
