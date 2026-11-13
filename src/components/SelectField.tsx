import { MenuItem, TextField } from "@mui/material";
import { startCase } from "es-toolkit";
import type React from "react";

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}

/** Field to choose one of the options, which are labeled in start case. */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>): React.JSX.Element {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(event) => {
        const option = options.find((current) => current === event.target.value);

        if (option !== undefined) {
          onChange(option);
        }
      }}
    >
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {startCase(option)}
        </MenuItem>
      ))}
    </TextField>
  );
}
