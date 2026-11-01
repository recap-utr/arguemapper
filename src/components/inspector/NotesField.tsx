import { type SxProps, TextField, type Theme } from "@mui/material";
import type React from "react";
import { useArgueConfig } from "@/store.js";

interface Props {
  onChange: (value: string) => void;
  value?: string;
  label?: string;
  placeholder?: string;
  sx?: SxProps<Theme>;
}

/** Shared multiline notes input used across the inspector field panels. */
export const NotesField: React.FC<Props> = ({
  onChange,
  value,
  label = "Notes",
  placeholder,
  sx,
}) => {
  const { readOnly } = useArgueConfig();

  return (
    <TextField
      slotProps={{ input: { readOnly } }}
      sx={sx}
      fullWidth
      multiline
      minRows={1}
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
};
