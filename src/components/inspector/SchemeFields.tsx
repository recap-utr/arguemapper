import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import * as arguebuf from "arguebuf";
import { dequal } from "dequal";
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

export interface Props extends React.PropsWithChildren {
  idx?: number;
}

type OptionalSchemeType = SchemeType | typeof NULL_VALUE;

const SchemeFields: React.FC<Props> = ({ idx = 0 }) => {
  const selectedIndex = useStore((state) => state.selection.nodes[idx]);
  const element = useStore(
    (state) => state.nodes[selectedIndex] as model.SchemeNode,
    dequal
  );
  const schemeType = element.data.scheme?.case ?? NULL_VALUE;

  return (
    <>
      <FormControl fullWidth>
        <InputLabel>Scheme Type</InputLabel>
        <Select
          value={schemeType}
          label="Scheme Type"
          onChange={(event) => {
            const newSchemeType = event.target.value as OptionalSchemeType;
            const newScheme =
              newSchemeType === NULL_VALUE
                ? { case: undefined }
                : defaultSchemes[newSchemeType];

            setState(
              produce((draft: State) => {
                const idx = draft.nodes.findIndex(
                  (node) => node.id === element.id
                );
                (draft.nodes[idx] as model.SchemeNode).data.scheme = newScheme;
              })
            );
          }}
        >
          <MenuItem value={NULL_VALUE}>Unknown</MenuItem>
          {Object.entries(SchemeType).map(([key, value]) => (
            <MenuItem key={key} value={value}>
              {startCase(value.toLowerCase())}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {element.data.scheme.case !== undefined && (
        <FormControl fullWidth>
          <InputLabel>Argumentation Scheme</InputLabel>
          <Select
            value={element.data.scheme.value}
            label="Argumentation Scheme"
            onChange={(event) => {
              setState(
                produce((draft: State) => {
                  const idx = draft.nodes.findIndex(
                    (node) => node.id === element.id
                  );
                  (draft.nodes[idx] as model.SchemeNode).data.scheme.value =
                    Number(event.target.value);
                })
              );
            }}
            defaultValue={0}
          >
            {Object.entries(schemeEnums[element.data.scheme.case])
              .filter(([key]) => Number.isNaN(Number(key)))
              .map(([key, value]) => {
                return (
                  <MenuItem key={value} value={value}>
                    {startCase(key.toLowerCase())}
                  </MenuItem>
                );
              })}
          </Select>
        </FormControl>
      )}
      <TextField
        fullWidth
        multiline
        minRows={1}
        label="Notes"
        value={(element.data.userdata as model.Userdata).notes ?? ""}
        onChange={(event) => {
          setState(
            produce((draft: State) => {
              const node = draft.nodes[selectedIndex];
              (node.data.userdata as model.Userdata).notes = event.target.value;
            })
          );
        }}
      />
    </>
  );
};

export default SchemeFields;
