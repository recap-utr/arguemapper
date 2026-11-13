import { TextField } from "@mui/material";
import type React from "react";
import type * as model from "@/model.js";

/** The explanation of the assistant for a node it created or changed. */
export const ExplanationField: React.FC<{ node: model.Node }> = ({ node }) => {
  const explanation = node.userdata.arguemapper?.assistant?.explanation;

  return explanation ? (
    <TextField
      fullWidth
      multiline
      label="Assistant explanation"
      slotProps={{ input: { readOnly: true } }}
      value={explanation}
    />
  ) : null;
};
