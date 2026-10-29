import { FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import type * as arguebuf from "arguebuf";
import type React from "react";
import { shallow } from "zustand/shallow";
import * as model from "@/model.js";
import { useArgueActions, useStore } from "@/store.js";
import { ExplanationField } from "@/components/inspector/ExplanationField.js";
import { NotesField } from "@/components/inspector/NotesField.js";
import {
  MIXED_VALUE,
  NULL_VALUE,
  schemeOf,
  schemeTypeItems,
  schemeValueItems,
  schemeWithValue,
} from "@/components/inspector/schemeSelect.js";

type OptionalSchemeType = arguebuf.SchemeType | typeof NULL_VALUE | typeof MIXED_VALUE;

/** The value shared by all items, otherwise `MIXED_VALUE`. */
function shared<T>(values: readonly T[]): T | typeof MIXED_VALUE {
  const unique = new Set(values);

  return unique.size === 1 ? values[0] : MIXED_VALUE;
}

/** Fields of the selected scheme nodes, edited together if several are selected. */
const SchemeFields: React.FC = () => {
  const ids = useStore((state) => state.selection.nodes);
  // only the selected nodes, so that changes elsewhere do not re-render
  const schemeNodes = useStore(
    ({ graph }) =>
      ids
        .map((id) => graph.nodes[id])
        .filter((node): node is model.SchemeNode => node?.type === "scheme"),
    shallow,
  );
  const { editGraph } = useArgueActions();
  const [single] = schemeNodes.length === 1 ? schemeNodes : [];

  if (schemeNodes.length === 0) {
    return null;
  }

  const currentType: OptionalSchemeType = shared(
    schemeNodes.map((node) => node.scheme.case ?? NULL_VALUE),
  );
  const currentValue =
    currentType === MIXED_VALUE || currentType === NULL_VALUE
      ? MIXED_VALUE
      : shared(schemeNodes.map((node) => node.scheme.value));

  const update = (
    changes: (node: model.SchemeNode) => arguebuf.SchemeChanges<model.NodeUserdata>,
  ) => editGraph((graph) => model.updateSchemes(graph, ids, changes));

  return (
    <>
      {single === undefined && (
        <Typography variant="h6">Scheme Nodes ({schemeNodes.length} selected)</Typography>
      )}

      <FormControl fullWidth>
        <InputLabel>Scheme Type</InputLabel>
        <Select<OptionalSchemeType>
          value={currentType}
          label="Scheme Type"
          onChange={(event) => {
            const { value } = event.target;

            if (value !== MIXED_VALUE) {
              update(() => ({ scheme: schemeOf(value) }));
            }
          }}
        >
          <MenuItem value={NULL_VALUE}>Unknown</MenuItem>
          {currentType === MIXED_VALUE && (
            <MenuItem value={MIXED_VALUE} disabled>
              Mixed Types
            </MenuItem>
          )}
          {schemeTypeItems()}
        </Select>
      </FormControl>

      {currentType !== NULL_VALUE && currentType !== MIXED_VALUE && (
        <FormControl fullWidth>
          <InputLabel>Argumentation Scheme</InputLabel>
          <Select
            value={currentValue === MIXED_VALUE ? "" : currentValue}
            label="Argumentation Scheme"
            onChange={(event) => {
              const value = Number(event.target.value);
              update(() => ({ scheme: schemeWithValue(currentType, value) }));
            }}
            displayEmpty
          >
            {currentValue === MIXED_VALUE && (
              <MenuItem value="" disabled>
                Mixed Values
              </MenuItem>
            )}
            {schemeValueItems(currentType)}
          </Select>
        </FormControl>
      )}

      {single !== undefined && <ExplanationField node={single} />}
      <NotesField
        value={single === undefined ? undefined : (single.userdata.notes ?? "")}
        label={single === undefined ? "Notes (replace the notes of all selected nodes)" : "Notes"}
        onChange={(notes) => {
          update((node) => ({ userdata: { ...node.userdata, notes } }));
        }}
      />
    </>
  );
};

export default SchemeFields;
