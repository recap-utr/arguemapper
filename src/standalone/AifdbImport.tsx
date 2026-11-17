import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { IconButton, Stack, TextField } from "@mui/material";
import type * as arguebuf from "arguebuf";
import type React from "react";
import { useState } from "react";
import { describeError } from "@/model.js";
import { useMenuClose } from "@/components/MenuItems.js";
import { useArgueActions } from "@/store.js";

/** The argument map with the id on aifdb.org, fetched via the dev/server proxy. */
async function fetchMap(id: string): Promise<arguebuf.load.JsonGraph> {
  const response = await fetch(`/api/aifdb/json/${id}`);

  if (!response.ok) {
    throw new Error(`${response.statusText} (${response.status})`);
  }

  return response.json();
}

/** Standalone-only file menu entry that opens an argument map of aifdb.org by its id. */
export const AifdbImport: React.FC = () => {
  const [aifdbId, setAifdbId] = useState("");
  const { notify, openGraph } = useArgueActions();
  const close = useMenuClose();

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
    <Stack
      component="form"
      direction="row"
      spacing={1}
      onSubmit={(event) => {
        event.preventDefault();
        void handleImport();
        close();
      }}
      // typing stays in the field instead of selecting menu entries
      onKeyDown={(event) => event.key !== "Escape" && event.stopPropagation()}
      sx={{ alignItems: "center", px: 2, py: 1 }}
    >
      <TextField
        size="small"
        label="AIFdb map ID"
        type="number"
        value={aifdbId}
        onChange={(event) => setAifdbId(event.target.value)}
      />
      <IconButton type="submit" aria-label="Open from AIFdb" disabled={aifdbId === ""}>
        <CloudDownloadIcon />
      </IconButton>
    </Stack>
  );
};
