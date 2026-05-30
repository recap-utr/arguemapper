import { MenuItem } from "@mui/material";
import { startCase } from "lodash";
import * as model from "../../model.js";

/** Sentinel select values for "no scheme" and (in bulk editing) "mixed selection". */
export const NULL_VALUE = "###NULL###";
export const MIXED_VALUE = "###MIXED###";

/** Menu items for picking a scheme case (Support, Attack, …). */
export const schemeTypeItems = () =>
  model.schemeCases.map((schemeCase) => (
    <MenuItem key={schemeCase} value={schemeCase}>
      {startCase(schemeCase)}
    </MenuItem>
  ));

/** Menu items for the concrete scheme values of a given case. */
export const schemeValueItems = (schemeCase: model.SchemeCase) =>
  model.schemeValueEntries(schemeCase).map(([label, value]) => (
    <MenuItem key={value} value={value}>
      {startCase(label.toLowerCase())}
    </MenuItem>
  ));
