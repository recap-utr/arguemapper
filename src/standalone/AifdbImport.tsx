import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, TextField } from "@mui/material";
import { useCallback, useState } from "react";
import * as convert from "../services/convert.js";
import { useArgueActions } from "../store.js";

/** Standalone-only import source: pulls an argument map from aifdb.org via the dev/server proxy. */
export const AifdbImport: React.FC = () => {
  const { resetState } = useArgueActions();
  const [aifdbId, setAifdbId] = useState<number | undefined>(undefined);

  const handleImport = useCallback(async () => {
    if (!aifdbId) return;

    const response = await fetch(`/api/aifdb/json/${aifdbId}`);
    if (!response.ok) {
      alert(
        `Failed to fetch AIFdb.org data for ID ${aifdbId}, possibly due to CORS: ${response.statusText} (${response.status})`,
      );
    }

    resetState(convert.importGraph(await response.json()));
    setAifdbId(undefined);
  }, [aifdbId, resetState]);

  return (
    <>
      <TextField
        label="AIFdb.org ID"
        type="number"
        fullWidth
        variant="outlined"
        value={aifdbId ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          setAifdbId(value === "" ? undefined : Number.parseInt(value, 10));
        }}
        helperText="Enter the numeric ID of an argument map from aifdb.org"
      />
      <Button
        startIcon={<FontAwesomeIcon icon={faDownload} />}
        variant="contained"
        onClick={handleImport}
        disabled={!aifdbId}
        fullWidth
      >
        Import from AIFdb.org
      </Button>
    </>
  );
};
