import { TextField } from "@mui/material";
import type React from "react";
import { useArgueConfig } from "@/store.js";

interface Props {
  onChange: (value: string) => void;
  value?: string;
  label?: string;
}

/** Shared multiline notes input used across the inspector field panels. */
export const NotesField: React.FC<Props> = ({ onChange, value, label = "Notes" }) => {
  const { readOnly } = useArgueConfig();

  return (
    <TextField
      slotProps={{ input: { readOnly } }}
      fullWidth
      multiline
      minRows={1}
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
};
