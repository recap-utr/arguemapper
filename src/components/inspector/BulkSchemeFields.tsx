import { FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import type React from "react";
import * as model from "@/model.js";
import { useArgueActions, useStore } from "@/store.js";
import { NotesField } from "@/components/inspector/NotesField.js";
import {
  MIXED_VALUE,
  NULL_VALUE,
  schemeTypeItems,
  schemeValueItems,
} from "@/components/inspector/schemeSelect.js";

type OptionalSchemeType = model.SchemeCase | typeof NULL_VALUE | typeof MIXED_VALUE;

const BulkSchemeFields: React.FC = () => {
  const selectedIndices = useStore((state) => state.selection.nodes);
  const nodes = useStore((state) => state.nodes);
  const { mutate } = useArgueActions();

  // Get only scheme nodes from selection
  const schemeNodes = selectedIndices
    .map((idx) => nodes[idx])
    .filter((node): node is model.SchemeNode => node.type === "scheme");

  if (schemeNodes.length === 0) {
    return <Typography variant="body1">No scheme nodes selected for bulk editing.</Typography>;
  }

  // Determine current scheme type (mixed if different types)
  const schemeTypes = schemeNodes.map((node) => node.data.scheme?.case ?? NULL_VALUE);
  const uniqueSchemeTypes = [...new Set(schemeTypes)];
  const currentSchemeType = uniqueSchemeTypes.length === 1 ? uniqueSchemeTypes[0] : MIXED_VALUE;

  // Determine current scheme value (mixed if different values within same type)
  const currentSchemeValue = (() => {
    if (currentSchemeType === MIXED_VALUE || currentSchemeType === NULL_VALUE) {
      return MIXED_VALUE;
    }
    const schemeValues = schemeNodes
      .filter((node) => node.data.scheme?.case === currentSchemeType)
      .map((node) => node.data.scheme?.value);
    const uniqueSchemeValues = [...new Set(schemeValues)];
    return uniqueSchemeValues.length === 1 ? uniqueSchemeValues[0] : MIXED_VALUE;
  })();

  // Apply a mutation to every selected scheme node, looked up by id in the draft.
  const updateSchemeNodes = (recipe: (node: model.SchemeNode) => void) => {
    mutate((draft) => {
      for (const node of schemeNodes) {
        const idx = draft.nodes.findIndex((n) => n.id === node.id);
        if (idx !== -1) {
          recipe(draft.nodes[idx] as model.SchemeNode);
        }
      }
    });
  };

  const handleSchemeTypeChange = (newSchemeType: OptionalSchemeType) => {
    if (newSchemeType === MIXED_VALUE) return;
    const newScheme =
      newSchemeType === NULL_VALUE ? { case: undefined } : model.defaultSchemes[newSchemeType];
    updateSchemeNodes((node) => {
      node.data.scheme = newScheme;
    });
  };

  const handleSchemeValueChange = (newValue: number) => {
    if (currentSchemeType === MIXED_VALUE || currentSchemeType === NULL_VALUE) return;
    updateSchemeNodes((node) => {
      if (node.data.scheme?.case === currentSchemeType) {
        node.data.scheme.value = newValue;
      }
    });
  };

  const handleNotesChange = (newNotes: string) => {
    updateSchemeNodes((node) => {
      const userData = (node.data.userdata as model.Userdata) ?? {};
      userData.notes = newNotes;
      node.data.userdata = userData;
    });
  };

  return (
    <>
      <Typography variant="h6">Bulk Edit Scheme Nodes ({schemeNodes.length} selected)</Typography>

      <FormControl fullWidth>
        <InputLabel>Scheme Type</InputLabel>
        <Select
          value={currentSchemeType}
          label="Scheme Type"
          onChange={(event) => handleSchemeTypeChange(event.target.value as OptionalSchemeType)}
        >
          <MenuItem value={NULL_VALUE}>Unknown</MenuItem>
          {currentSchemeType === MIXED_VALUE && (
            <MenuItem value={MIXED_VALUE} disabled>
              Mixed Types
            </MenuItem>
          )}
          {schemeTypeItems()}
        </Select>
      </FormControl>

      {currentSchemeType !== NULL_VALUE && currentSchemeType !== MIXED_VALUE && (
        <FormControl fullWidth>
          <InputLabel>Argumentation Scheme</InputLabel>
          <Select
            value={currentSchemeValue === MIXED_VALUE ? "" : currentSchemeValue}
            label="Argumentation Scheme"
            onChange={(event) => handleSchemeValueChange(Number(event.target.value))}
            displayEmpty
          >
            {currentSchemeValue === MIXED_VALUE && (
              <MenuItem value="" disabled>
                Mixed Values
              </MenuItem>
            )}
            {schemeValueItems(currentSchemeType)}
          </Select>
        </FormControl>
      )}

      <NotesField
        label="Notes (will replace all selected nodes' notes)"
        placeholder="Enter notes to apply to all selected scheme nodes"
        onChange={handleNotesChange}
      />
    </>
  );
};

export default BulkSchemeFields;
