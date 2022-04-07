import {
  faBan,
  faPlusCircle,
  faSave,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Button, Stack, Tab, TextField, Typography } from "@mui/material";
import produce from "immer";
import _ from "lodash";
import React, { useCallback, useEffect, useState } from "react";
// @ts-ignore
import { HighlightWithinTextarea } from "react-highlight-within-textarea";
import { v1 as uuid } from "uuid";
import * as cytoModel from "../model/cytoWrapper";
import { useGraph } from "./GraphContext";

interface Selection {
  anchor: number;
  focus: number;
}

function Resources({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement>;
}) {
  const { cy, updateGraph } = useGraph();

  const [resources, setResources] = useState<{
    [x: string]: cytoModel.resource.Resource;
  }>({});
  const [allowTabChange, setAllowTabChange] = useState(true);
  const [activeTab, setActiveTab] = useState("1");
  const [shouldWrite, setShouldWrite] = useState(false);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      if (allowTabChange) {
        setActiveTab(newValue);
      }
    },
    [allowTabChange]
  );

  const addAtom = useCallback(
    (text: string) => {
      if (cy) {
        const newElem = cytoModel.node.initAtom(text);
        let width = window.innerWidth;
        let height = window.innerHeight;
        const container = containerRef.current;

        if (container) {
          width = container.clientWidth;
          height = container.clientHeight;
        }

        // @ts-ignore
        cy.add({
          // @ts-ignore
          nodes: [
            {
              data: newElem,
              renderedPosition: {
                x: width / 2,
                y: height / 2,
              },
            },
          ],
        });
        updateGraph();
        cy.$id(newElem.id).select();
      }
    },
    [cy, updateGraph, containerRef]
  );

  const writeResources = useCallback(() => {
    setShouldWrite(true);
  }, []);

  useEffect(() => {
    if (cy && shouldWrite) {
      cy.data("resources", resources);
      updateGraph();
      setShouldWrite(false);
    }
  }, [resources, cy, updateGraph, shouldWrite]);

  const resetResources = useCallback(() => {
    if (cy) {
      setResources(cy.data("resources"));
    }
  }, [cy]);

  // If a new cytoscape instance is created, we need to update our local resource object
  // Otherwise, the data would not be consistent!
  useEffect(() => {
    resetResources();
  }, [resetResources]);

  const lastResourceIndex = (Object.keys(resources).length + 1).toString();

  const deleteResource = useCallback(
    (key: string) => {
      setResources(
        produce((draft) => {
          delete draft[key];
        })
      );
      writeResources();
      setAllowTabChange(true);
    },
    [writeResources]
  );

  const addResource = useCallback(() => {
    setResources(
      produce((draft) => {
        draft[uuid()] = cytoModel.resource.init("");
      })
    );
    writeResources();
    setAllowTabChange(true);
  }, [writeResources]);

  return (
    <TabContext value={activeTab}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <TabList
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons={true}
        >
          {Object.keys(resources).map((key, index) => (
            <Tab
              key={index + 1}
              label={(index + 1).toString()}
              value={(index + 1).toString()}
              sx={{ minWidth: 50 }}
            />
          ))}
          <Tab
            label={lastResourceIndex}
            value={lastResourceIndex}
            sx={{ minWidth: 50 }}
          />
        </TabList>
      </Box>
      {Object.entries(resources).map(([key, resource], index) => (
        <TabPanel key={index + 1} value={(index + 1).toString()}>
          <Resource
            id={key}
            resource={resource}
            index={index + 1}
            deleteResource={deleteResource}
            setAllowTabChange={setAllowTabChange}
            setResources={setResources}
            resetResources={resetResources}
            writeResources={writeResources}
            addAtom={addAtom}
          />
        </TabPanel>
      ))}
      <TabPanel value={lastResourceIndex}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
          onClick={addResource}
        >
          Add Resource
        </Button>
      </TabPanel>
    </TabContext>
  );
}

function Resource({
  id,
  resource,
  index,
  deleteResource,
  setAllowTabChange,
  setResources,
  resetResources,
  writeResources,
  addAtom,
}: {
  id: string;
  resource: cytoModel.resource.Resource;
  index: number;
  deleteResource: (key: string) => void;
  setAllowTabChange: (value: boolean) => void;
  setResources: React.Dispatch<
    React.SetStateAction<{
      [x: string]: cytoModel.resource.Resource;
    }>
  >;
  resetResources: () => void;
  writeResources: () => void;
  addAtom: (text: string) => void;
}) {
  const [userSelection, setUserSelection] = useState<Selection>({
    anchor: 0,
    focus: 0,
  });
  const [systemSelection, setSystemSelection] = useState<Selection | null>(
    null
  );
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setAllowTabChange(!hasChanged);
  }, [setAllowTabChange, hasChanged]);

  const produceHandleChange = useCallback(
    (attr: string | string[]) => {
      // We need to return a function here, thus the nested callbacks
      return (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        // Prevent the user switching to another tab.
        // Otherwise, the local changes would be lost.
        setHasChanged(true);
        setResources(
          produce((draft) => {
            _.set(draft, attr, event.target.value);
          })
        );
      };
    },
    [setResources]
  );

  const handleTextChange = useCallback(
    (value: string, selection: Selection) => {
      if (value === resource.text) {
        setUserSelection(selection);
        setSystemSelection(null);
      } else {
        setHasChanged(true);
        setResources(
          produce((draft) => {
            draft[id].text = value;
          })
        );
      }
    },
    [setResources, id, resource.text]
  );

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Resource {index}</Typography>
      <TextField
        hiddenLabel
        fullWidth
        multiline
        minRows={5}
        value={resource.text}
        onChange={handleTextChange as any}
        InputProps={{
          inputComponent: HighlightWithinTextarea as any,
          inputProps: {
            selection: systemSelection,
          },
        }}
      />
      {hasChanged && (
        <Stack justifyContent="space-around" direction="row" sx={{ width: 1 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<FontAwesomeIcon icon={faBan} />}
            onClick={() => {
              resetResources();
              setHasChanged(false);
              setAllowTabChange(true);
            }}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            startIcon={<FontAwesomeIcon icon={faSave} />}
            onClick={() => {
              writeResources();
              setHasChanged(false);
              setAllowTabChange(true);
            }}
          >
            Save
          </Button>
        </Stack>
      )}
      {!hasChanged && (
        <>
          <Button
            fullWidth
            variant="contained"
            startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
            onClick={() => {
              addAtom(
                resource.text.substring(
                  userSelection.anchor,
                  userSelection.focus
                )
              );
            }}
          >
            Add selected text
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            startIcon={<FontAwesomeIcon icon={faTrash} />}
            onClick={() => {
              deleteResource(id);
            }}
          >
            Delete Resource
          </Button>
        </>
      )}
    </Stack>
  );
}

export default Resources;
