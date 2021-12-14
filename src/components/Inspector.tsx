import { faBan, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Toolbar,
} from "@mui/material";
import produce from "immer";
import _ from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import * as cytoModel from "../model/cytoModel";
import { useGraph } from "./GraphContext";

function Inspector() {
  const { cy, updateGraph } = useGraph();
  // @ts-ignore
  const [element, setElement] = useState(cy?.data());

  useEffect(() => {
    setElement(null);

    if (cy) {
      cy.on("select", (e) => {
        setElement(e.target.data());
      });
      cy.on("unselect", (e) => {
        // @ts-ignore
        setElement(cy.data());
      });
    }
  }, [cy]);

  const handleChange = useCallback(
    (attr: string | string[]) => {
      // We need to return a function here, thus the nested callbacks
      return (
        event:
          | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          | React.ChangeEvent<{
              name?: string;
              value: any;
              event: Event | React.SyntheticEvent<Element, Event>;
            }>
          | SelectChangeEvent<HTMLInputElement>
      ) => {
        if (cy) {
          cy.elements().unselectify();

          setElement((element) => {
            return produce(element, (draft) => {
              _.set(draft, attr, event.target.value);
            });
          });
        }
      };
    },
    [cy]
  );

  let fields = null;

  if (element) {
    if (element.kind === "scheme") {
      fields = (
        <>
          <FormControl fullWidth>
            <InputLabel>Scheme</InputLabel>
            <Select
              value={element.type}
              label="Scheme"
              onChange={handleChange("type")}
            >
              {Object.entries(cytoModel.node.SchemeType).map(
                ([menuValue, description]) => (
                  <MenuItem key={description} value={menuValue}>
                    {description}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        </>
      );
    } else if (element.kind === "atom") {
      fields = (
        <>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Text"
            value={element.text}
            onChange={handleChange("text")}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Original Text"
            value={element.resource?.text}
            onChange={handleChange(["resource", "text"])}
          />
        </>
      );
    } else if (element.source && element.target) {
      // edge
    } else {
      // graph
    }
  }

  return (
    <>
      <Toolbar>
        <Stack justifyContent="space-around" direction="row" sx={{ width: 1 }}>
          <Button
            variant="contained"
            startIcon={<FontAwesomeIcon icon={faSave} />}
            onClick={() => {
              if (element) {
                const cytoElem = cy.$id(element.id);
                cytoElem.data(element);
                updateGraph();
              }
              cy.elements().selectify();
            }}
          >
            Save
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<FontAwesomeIcon icon={faBan} />}
            onClick={() => {
              cy.elements().selectify();
              cy.elements().unselect();
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Toolbar>
      <Stack spacing={3} sx={{ padding: 3 }}>
        {fields}
      </Stack>
    </>
  );
}

export default Inspector;
