import {
  faBan,
  faDownload,
  faSave,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
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
  Typography,
} from "@mui/material";
import produce from "immer";
import _ from "lodash";
import { useConfirm } from "material-ui-confirm";
import React, { useCallback, useEffect, useState } from "react";
import * as cytoModel from "../model/cytoWrapper";
import { isAtom, isScheme } from "../model/node";
import { cyto2aif, cyto2protobuf, proto2json } from "../services/convert";
import { useGraph } from "./GraphContext";

const NULL_VALUE = "###NULL###";

// https://stackoverflow.com/a/55613750/7626878
async function downloadJson(data: any, filename?: string) {
  if (!filename) {
    filename = new Date().toISOString().replace("T", "-").replace(":", "-");
    filename = filename.substring(0, filename.indexOf("."));
  }

  if (!filename.endsWith(".json")) {
    filename = `${filename}.json`;
  }

  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: "application/json" });
  const href = await URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function Inspector() {
  const { cy, updateGraph, exportState, resetGraph } = useGraph();
  // @ts-ignore
  const [element, setElement] = useState(cy?.data());
  const [hasChanged, setHasChanged] = useState(false);
  const confirm = useConfirm();

  const downloadProtobuf = useCallback(() => {
    downloadJson(proto2json(cyto2protobuf(exportState())));
  }, [exportState]);

  const downloadAif = useCallback(() => {
    downloadJson(cyto2aif(exportState()));
  }, [exportState]);

  useEffect(() => {
    setElement(null);

    cy?.on("select", (e) => {
      setHasChanged(false);
      setElement(e.target.data());
    });
    cy?.on("unselect", (e) => {
      setHasChanged(false);
      // @ts-ignore
      setElement(cy?.data());
    });
  }, [cy, setHasChanged]);

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
          | SelectChangeEvent<HTMLInputElement | string>
      ) => {
        setHasChanged(true);

        if (cy) {
          // Prevent the user from selecting another element.
          // Otherwise, the local changes would be lost.
          cy.elements().unselectify();

          // Update our interim element
          setElement((element: any) => {
            let newValue = event.target.value;

            // For select fields with optional values, convert "Undefined" to undefined.
            // This is hacky!
            if (newValue === NULL_VALUE) {
              newValue = undefined;
            }

            // As we cannot directly modify it, we need to "produce" a new one
            return produce(element, (draft: any) => {
              // Update the given attribute with the new value
              _.set(draft, attr, newValue);
            });
          });
        }
      };
    },
    [cy]
  );

  let fields = null;

  if (element && isScheme(element)) {
    fields = (
      <>
        <FormControl fullWidth>
          <InputLabel>Scheme Type</InputLabel>
          <Select
            value={element.type}
            label="Scheme Type"
            onChange={handleChange("type")}
            defaultValue={NULL_VALUE}
          >
            {Object.entries(cytoModel.node.SchemeType).map(([key, value]) => (
              <MenuItem key={key} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Argumentation Scheme</InputLabel>
          <Select
            value={element.argumentationScheme}
            label="Argumentation Scheme"
            onChange={handleChange("argumentationScheme")}
            defaultValue={NULL_VALUE}
          >
            {Object.entries(cytoModel.node.Scheme).map(([key, value]) => {
              return (
                <MenuItem key={key} value={value}>
                  {value}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </>
    );
  } else if (element && isAtom(element)) {
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
          value={element.reference?.text}
          onChange={handleChange(["resource", "text"])}
        />
      </>
    );
  } else if (element && element.source && element.target) {
    // edge
  } else {
    fields = (
      <>
        <Button
          variant="contained"
          color="error"
          startIcon={<FontAwesomeIcon icon={faTrashAlt} />}
          onClick={() => {
            confirm().then(() => resetGraph(false));
          }}
        >
          Reset Graph
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<FontAwesomeIcon icon={faTrashAlt} />}
          onClick={() => {
            confirm().then(() => resetGraph(true));
          }}
        >
          Load Demo
        </Button>
        <Typography variant="h6">Download</Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<FontAwesomeIcon icon={faDownload} />}
          onClick={downloadProtobuf}
        >
          Arguebuf
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<FontAwesomeIcon icon={faDownload} />}
          onClick={downloadAif}
        >
          AIF
        </Button>
      </>
    );
  }

  return (
    <>
      <Toolbar>
        <Typography variant="h5">Inspector</Typography>
      </Toolbar>
      <Stack spacing={3} sx={{ padding: 3 }}>
        {fields}
        {hasChanged && (
          <Stack
            justifyContent="space-around"
            direction="row"
            sx={{ width: 1 }}
          >
            <Button
              variant="contained"
              startIcon={<FontAwesomeIcon icon={faSave} />}
              onClick={() => {
                if (element) {
                  const cytoElem = cy?.$id(element.id);
                  cytoElem?.data(element);
                  updateGraph();
                }
                cy?.elements().selectify();
                setHasChanged(false);
              }}
            >
              Save
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<FontAwesomeIcon icon={faBan} />}
              onClick={() => {
                cy?.elements().selectify();
                cy?.elements().unselect();
                setHasChanged(false);
              }}
            >
              Discard
            </Button>
          </Stack>
        )}
      </Stack>
    </>
  );
}

export default Inspector;
