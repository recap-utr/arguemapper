import { Autocomplete, TextField, Typography } from "@mui/material";
import * as arguebuf from "arguebuf";
import type React from "react";
import { shallow } from "zustand/shallow";
import { AdvancedSection } from "@/components/inspector/AdvancedSection.js";
import { ExplanationField } from "@/components/inspector/ExplanationField.js";
import { NotesField } from "@/components/inspector/NotesField.js";
import { SchemeTypeToggle } from "@/components/inspector/SchemeTypeToggle.js";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useStore } from "@/store.js";

/** Fields of the selected scheme nodes, edited together if several are selected. */
export const SchemeFields: React.FC = () => {
  const ids = useStore((state) => state.selection.nodes);
  // only the selected nodes, so that changes elsewhere do not re-render
  const schemeNodes = useStore(
    ({ graph }) =>
      ids
        .map((id) => graph.nodes[id])
        .filter((node): node is model.SchemeNode => node?.type === "scheme"),
    shallow,
  );
  const { readOnly } = useArgueConfig();
  const { editGraph } = useArgueActions();
  const [single] = schemeNodes.length === 1 ? schemeNodes : [];
  const type = model.shared(schemeNodes.map(({ scheme }) => scheme.case));
  const options = type === undefined ? [] : arguebuf.schemeValues(type);
  const value = model.shared(schemeNodes.map(({ scheme }) => scheme.value));

  const update = (changes: (node: model.SchemeNode) => arguebuf.SchemeChanges<model.NodeUserdata>) =>
    editGraph((graph) => model.updateSchemes(graph, ids, changes));

  return (
    <>
      <Typography variant="overline">
        {single ? "Relation" : `${schemeNodes.length} relations`}
      </Typography>
      <SchemeTypeToggle ids={ids} fullWidth size="small" />
      {type !== undefined && options.length > 1 && (
        <Autocomplete
          options={options}
          value={options.find((option) => option.value === value) ?? null}
          getOptionLabel={(scheme) => arguebuf.schemeValueLabel(scheme)}
          isOptionEqualToValue={(option, current) => option.value === current.value}
          disabled={readOnly}
          // clearing the scheme leaves the default one of the type
          onChange={(_event, scheme) =>
            update(() => ({ scheme: scheme ?? arguebuf.defaultScheme(type) }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Argumentation scheme"
              placeholder={value === undefined ? "Mixed" : undefined}
              helperText="Optional, the kind of reasoning"
            />
          )}
        />
      )}
      <AdvancedSection id={single?.id}>
        {single !== undefined && <ExplanationField node={single} />}
        <NotesField
          value={single === undefined ? undefined : (single.userdata.notes ?? "")}
          label={single === undefined ? "Notes (replaces the notes of all)" : "Notes"}
          onChange={(notes) =>
            editGraph((graph) => ids.forEach((id) => model.setNotes(graph, id, notes)))
          }
        />
      </AdvancedSection>
    </>
  );
};

