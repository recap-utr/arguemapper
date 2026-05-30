import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { dequal } from "dequal";
import type React from "react";
import { useCallback } from "react";
import * as model from "../../model.js";
import { mutate, useStore } from "../../store.js";
import { NotesField } from "./NotesField.js";
import { NULL_VALUE, schemeTypeItems, schemeValueItems } from "./schemeSelect.js";

export interface Props extends React.PropsWithChildren {
  idx?: number;
}

type OptionalSchemeType = model.SchemeCase | typeof NULL_VALUE;

const SchemeFields: React.FC<Props> = ({ idx = 0 }) => {
  const selectedIndex = useStore((state) => state.selection.nodes[idx]);
  const element = useStore((state) => state.nodes[selectedIndex] as model.SchemeNode, dequal);
  const schemeType = element.data.scheme?.case ?? NULL_VALUE;

  const updateNotes = useCallback(
    (value: string) => {
      mutate((draft) => {
        (draft.nodes[selectedIndex].data.userdata as model.Userdata).notes = value;
      });
    },
    [selectedIndex],
  );

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
                : model.defaultSchemes[newSchemeType];

            mutate((draft) => {
              const i = draft.nodes.findIndex((node) => node.id === element.id);
              (draft.nodes[i] as model.SchemeNode).data.scheme = newScheme;
            });
          }}
        >
          <MenuItem value={NULL_VALUE}>Unknown</MenuItem>
          {schemeTypeItems()}
        </Select>
      </FormControl>
      {element.data.scheme.case !== undefined && (
        <FormControl fullWidth>
          <InputLabel>Argumentation Scheme</InputLabel>
          <Select
            value={element.data.scheme.value}
            label="Argumentation Scheme"
            onChange={(event) => {
              mutate((draft) => {
                const i = draft.nodes.findIndex((node) => node.id === element.id);
                (draft.nodes[i] as model.SchemeNode).data.scheme.value = Number(event.target.value);
              });
            }}
            defaultValue={0}
          >
            {schemeValueItems(element.data.scheme.case)}
          </Select>
        </FormControl>
      )}
      <NotesField
        value={(element.data.userdata as model.Userdata).notes ?? ""}
        onChange={updateNotes}
      />
    </>
  );
};

export default SchemeFields;
