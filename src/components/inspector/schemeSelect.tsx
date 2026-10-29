import { MenuItem } from "@mui/material";
import * as arguebuf from "arguebuf";

/** Sentinel select values for "no scheme" and (in bulk editing) "mixed selection". */
export const NULL_VALUE = "###NULL###";
export const MIXED_VALUE = "###MIXED###";

/** Menu items for picking a scheme type (Support, Attack, …). */
export const schemeTypeItems = (): React.JSX.Element[] =>
  arguebuf.schemeTypes.map((type) => (
    <MenuItem key={type} value={type}>
      {arguebuf.schemeLabel(arguebuf.defaultScheme(type))}
    </MenuItem>
  ));

/** Menu items for the concrete schemes of a given type. */
export const schemeValueItems = (type: arguebuf.SchemeType): React.JSX.Element[] =>
  arguebuf.schemeValues(type).map((scheme) => (
    <MenuItem key={scheme.value} value={scheme.value}>
      {arguebuf.schemeValueLabel(scheme)}
    </MenuItem>
  ));

/** The scheme selected in a scheme type menu. */
export const schemeOf = (value: arguebuf.SchemeType | typeof NULL_VALUE): arguebuf.Scheme =>
  value === NULL_VALUE ? { case: undefined } : arguebuf.defaultScheme(value);

/** The scheme of the type with the selected value, e.g. `Support.EXPERT_OPINION`. */
export const schemeWithValue = (type: arguebuf.SchemeType, value: number): arguebuf.Scheme =>
  arguebuf.schemeValues(type).find((scheme) => scheme.value === value) ??
  arguebuf.defaultScheme(type);
