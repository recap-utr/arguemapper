import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { dequal } from "dequal";
import produce from "immer";
import { startCase } from "lodash";
import React from "react";
import * as model from "../../model";
import useStore, { State } from "../../store";

const NULL_VALUE = "###NULL###";

export interface Props extends React.PropsWithChildren {
  idx?: number;
}

const SchemeFields: React.FC<Props> = ({ idx = 0, children }) => {
  const setState = useStore((state) => state.setState);
  const selectedIndex = useStore((state) => state.selection.nodes[idx]);
  const element = useStore(
    (state) => state.nodes[selectedIndex] as model.SchemeNode,
    dequal
  );
  const schemeType = element.data.scheme?.type ?? NULL_VALUE;

  return (
    <>
      <FormControl fullWidth>
        <InputLabel>Scheme Type</InputLabel>
        <Select
          value={schemeType}
          label="Scheme Type"
          onChange={(event) => {
            const newSchemeType = event.target.value as
              | model.SchemeType
              | typeof NULL_VALUE;

            setState(
              produce((draft: State) => {
                const idx = draft.nodes.findIndex(
                  (node) => node.id === element.id
                );
                if (newSchemeType === NULL_VALUE) {
                  (draft.nodes[idx] as model.SchemeNode).data.scheme =
                    undefined;
                } else {
                  (draft.nodes[idx] as model.SchemeNode).data.scheme = {
                    type: newSchemeType,
                    value: model.schemeMap[newSchemeType].DEFAULT,
                  } as model.Scheme;
                }
              })
            );
          }}
        >
          <MenuItem value={NULL_VALUE}>Unknown</MenuItem>
          {Object.entries(model.SchemeType).map(([key, value]) => (
            <MenuItem key={key} value={value}>
              {startCase(value)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {element.data.scheme !== undefined && schemeType !== NULL_VALUE && (
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
      )}
      <TextField
        fullWidth
        multiline
        minRows={1}
        label="Notes"
        value={element.data.userdata.notes ?? ""}
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
