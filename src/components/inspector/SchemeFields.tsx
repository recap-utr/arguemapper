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
import React from "react";
import * as model from "../../model.js";
import { setState, State, useStore } from "../../store.js";

enum SchemeType {
  SUPPORT = "support",
  ATTACK = "attack",
  REPHRASE = "rephrase",
  PREFERENCE = "preference",
}

const schemeMap: {
  [key in SchemeType]: arguebuf.Scheme;
} = {
  support: { case: "support", value: arguebuf.Support.DEFAULT },
  attack: { case: "attack", value: arguebuf.Attack.DEFAULT },
  rephrase: { case: "rephrase", value: arguebuf.Rephrase.DEFAULT },
  preference: { case: "preference", value: arguebuf.Preference.DEFAULT },
};

const NULL_VALUE = "###NULL###";

export interface Props extends React.PropsWithChildren {
  idx?: number;
}

type OptionalSchemeType = SchemeType | typeof NULL_VALUE;

const SchemeFields: React.FC<Props> = ({ idx = 0, children }) => {
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
          defaultValue={schemeType}
          label="Scheme Type"
          onChange={(event) => {
            const newSchemeType = event.target.value as OptionalSchemeType;

            setState(
              produce((draft: State) => {
                const idx = draft.nodes.findIndex(
                  (node) => node.id === element.id
                );
                (draft.nodes[idx] as model.SchemeNode).data.scheme =
                  newSchemeType === NULL_VALUE
                    ? { case: undefined }
                    : ((draft.nodes[idx] as model.SchemeNode).data.scheme =
                        schemeMap[newSchemeType]);
              })
            );
          }}
        >
          <MenuItem value={NULL_VALUE}>Unknown</MenuItem>
          {Object.entries(SchemeType).map(([key, value]) => (
            <MenuItem key={key} value={value}>
              {startCase(value)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {/* TODO: Argumentation scheme not selectable at the moment */}
      {/* {element.data.scheme !== undefined && schemeType !== NULL_VALUE && (
        <FormControl fullWidth>
          <InputLabel>Argumentation Scheme</InputLabel>
          <Select
            value={arguebuf.scheme2string(element.data.scheme)}
            label="Argumentation Scheme"
            onChange={(event) => {
              setState(
                produce((draft: State) => {
                  const idx = draft.nodes.findIndex(
                    (node) => node.id === element.id
                  );
                  (draft.nodes[idx] as model.SchemeNode).data.scheme!.value =
                    event.target.value as model.SchemeValue;
                })
              );
            }}
            defaultValue={NULL_VALUE}
          >
            {Object.entries(model.schemeMap[schemeType]).map(([key, value]) => {
              return (
                <MenuItem key={key} value={value}>
                  {value}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      )} */}
      <TextField
        fullWidth
        multiline
        minRows={1}
        label="Notes"
        defaultValue={element.data.userdata.notes ?? ""}
        onChange={(event) => {
          setState(
            produce((draft: State) => {
              const node = draft.nodes[selectedIndex];
              node.data.userdata.notes = event.target.value;
            })
          );
        }}
      />
    </>
  );
};

export default SchemeFields;
