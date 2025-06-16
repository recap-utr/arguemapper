import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import * as arguebuf from "arguebuf";
import { produce } from "immer";
import { startCase } from "lodash";
import type React from "react";
import type * as model from "../../model.js";
import { type State, setState, useStore } from "../../store.js";

enum SchemeType {
  SUPPORT = "support",
  ATTACK = "attack",
  REPHRASE = "rephrase",
  PREFERENCE = "preference",
}

const defaultSchemes: Record<SchemeType, arguebuf.Scheme> = {
  support: { case: "support", value: arguebuf.Support.DEFAULT },
  attack: { case: "attack", value: arguebuf.Attack.DEFAULT },
  rephrase: { case: "rephrase", value: arguebuf.Rephrase.DEFAULT },
  preference: { case: "preference", value: arguebuf.Preference.DEFAULT },
};

const schemeEnums = {
  support: arguebuf.Support,
  attack: arguebuf.Attack,
  rephrase: arguebuf.Rephrase,
  preference: arguebuf.Preference,
};

const NULL_VALUE = "###NULL###";
const MIXED_VALUE = "###MIXED###";

type OptionalSchemeType = SchemeType | typeof NULL_VALUE | typeof MIXED_VALUE;

const BulkSchemeFields: React.FC = () => {
  const selectedIndices = useStore((state) => state.selection.nodes);
  const nodes = useStore((state) => state.nodes);

  // Get only scheme nodes from selection
  const schemeNodes = selectedIndices
    .map((idx) => nodes[idx])
    .filter((node): node is model.SchemeNode => node.type === "scheme");

  if (schemeNodes.length === 0) {
    return (
      <Typography variant="body1">
        No scheme nodes selected for bulk editing.
      </Typography>
    );
  }

  // Determine current scheme type (mixed if different types)
  const schemeTypes = schemeNodes.map(
    (node) => node.data.scheme?.case ?? NULL_VALUE,
  );
  const uniqueSchemeTypes = [...new Set(schemeTypes)];
  const currentSchemeType =
    uniqueSchemeTypes.length === 1 ? uniqueSchemeTypes[0] : MIXED_VALUE;

  // Determine current scheme value (mixed if different values within same type)
  const currentSchemeValue = (() => {
    if (currentSchemeType === MIXED_VALUE || currentSchemeType === NULL_VALUE) {
      return MIXED_VALUE;
    }
    const schemeValues = schemeNodes
      .filter((node) => node.data.scheme?.case === currentSchemeType)
      .map((node) => node.data.scheme?.value);
    const uniqueSchemeValues = [...new Set(schemeValues)];
    return uniqueSchemeValues.length === 1
      ? uniqueSchemeValues[0]
      : MIXED_VALUE;
  })();

  const handleSchemeTypeChange = (newSchemeType: OptionalSchemeType) => {
    if (newSchemeType === MIXED_VALUE) return;

    const newScheme =
      newSchemeType === NULL_VALUE
        ? { case: undefined }
        : defaultSchemes[newSchemeType];

    setState(
      produce((draft: State) => {
        for (const node of schemeNodes) {
          const idx = draft.nodes.findIndex((n) => n.id === node.id);
          if (idx !== -1) {
            (draft.nodes[idx] as model.SchemeNode).data.scheme = newScheme;
          }
        }
      }),
    );
  };

  const handleSchemeValueChange = (newValue: number) => {
    if (currentSchemeType === MIXED_VALUE || currentSchemeType === NULL_VALUE)
      return;

    setState(
      produce((draft: State) => {
        for (const node of schemeNodes.filter(
          (node) => node.data.scheme?.case === currentSchemeType,
        )) {
          const idx = draft.nodes.findIndex((n) => n.id === node.id);
          if (idx !== -1) {
            (draft.nodes[idx] as model.SchemeNode).data.scheme.value = newValue;
          }
        }
      }),
    );
  };

  const handleNotesChange = (newNotes: string) => {
    setState(
      produce((draft: State) => {
        for (const node of schemeNodes) {
          const idx = draft.nodes.findIndex((n) => n.id === node.id);
          if (idx !== -1) {
            const userData =
              (draft.nodes[idx].data.userdata as model.Userdata) ?? {};
            userData.notes = newNotes;
            draft.nodes[idx].data.userdata = userData;
          }
        }
      }),
    );
  };

  return (
    <>
      <Typography variant="h6">
        Bulk Edit Scheme Nodes ({schemeNodes.length} selected)
      </Typography>

      <FormControl fullWidth>
        <InputLabel>Scheme Type</InputLabel>
        <Select
          value={currentSchemeType}
          label="Scheme Type"
          onChange={(event) =>
            handleSchemeTypeChange(event.target.value as OptionalSchemeType)
          }
        >
          <MenuItem value={NULL_VALUE}>Unknown</MenuItem>
          {currentSchemeType === MIXED_VALUE && (
            <MenuItem value={MIXED_VALUE} disabled>
              Mixed Types
            </MenuItem>
          )}
          {Object.entries(SchemeType).map(([key, value]) => (
            <MenuItem key={key} value={value}>
              {startCase(value.toLowerCase())}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {currentSchemeType !== NULL_VALUE &&
        currentSchemeType !== MIXED_VALUE && (
          <FormControl fullWidth>
            <InputLabel>Argumentation Scheme</InputLabel>
            <Select
              value={
                currentSchemeValue === MIXED_VALUE ? "" : currentSchemeValue
              }
              label="Argumentation Scheme"
              onChange={(event) =>
                handleSchemeValueChange(Number(event.target.value))
              }
              displayEmpty
            >
              {currentSchemeValue === MIXED_VALUE && (
                <MenuItem value="" disabled>
                  Mixed Values
                </MenuItem>
              )}
              {Object.entries(schemeEnums[currentSchemeType])
                .filter(([key]) => Number.isNaN(Number(key)))
                .map(([key, value]) => (
                  <MenuItem key={value} value={value}>
                    {startCase(key.toLowerCase())}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

      <TextField
        fullWidth
        multiline
        minRows={1}
        label="Notes (will replace all selected nodes' notes)"
        placeholder="Enter notes to apply to all selected scheme nodes"
        onChange={(event) => handleNotesChange(event.target.value)}
      />
    </>
  );
};

export default BulkSchemeFields;
