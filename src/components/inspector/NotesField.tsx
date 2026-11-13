import { TextField } from "@mui/material";
import type React from "react";
import { useArgueConfig } from "@/store.js";

interface Props {
  value: string;
  /** The edited elements have different notes. */
  mixed?: boolean;
  onChange: (value: string) => void;
}

/** Notes of the graph or of the selected elements, which typing replaces. */
export const NotesField: React.FC<Props> = ({ value, mixed = false, onChange }) => {
  const { readOnly } = useArgueConfig();

  return (
    <TextField
      slotProps={{ input: { readOnly } }}
      fullWidth
      multiline
      label="Notes"
      value={value}
      placeholder={mixed ? "Mixed" : undefined}
      onChange={(event) => onChange(event.target.value)}
    />
  );
};
