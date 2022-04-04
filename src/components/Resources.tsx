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
import React, { useCallback, useEffect, useRef, useState } from "react";
import { v1 as uuid } from "uuid";
import * as cytoModel from "../model/cytoWrapper";
import { useGraph } from "./GraphContext";

// Highlight references in textfield: https://github.com/bonafideduck/react-highlight-within-textarea/

function Resources() {
  const { cy, updateGraph } = useGraph();
  const cyResources = useCallback(() => (cy ? cy.data("resources") : {}), [cy]);

  const [resources, setResources] = useState<{
    [x: string]: cytoModel.resource.Resource;
  }>(cyResources);
  // This ref is necessary to avoid an infinite re-rendering loop
  // Otherwise, the callback containing 'cy.on' would be executed every time 'references' changes.
  const resourcesRef = useRef(cyResources());
  const [hasChanged, setHasChanged] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      if (!hasChanged) {
        setActiveTab(newValue);
      }
    },
    [hasChanged]
  );

  // If a new cytoscape instance is created, we need to update our local resource object
  // Otherwise, the data would not be consistent!
  useEffect(() => {
    setResources(cyResources);
  }, [cyResources]);

  // Update ref to maintain consistency
  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  useEffect(() => {
    if (cy) {
      cy.on("data", () => {
        if (cy.data("resources") !== resourcesRef.current) {
          setResources(cy.data("resources"));
        }
      });
    }
  }, [cy]);

  const lastResourceIndex = (Object.keys(resources).length + 1).toString();

  const handleChange = useCallback((attr: string | string[]) => {
    // We need to return a function here, thus the nested callbacks
    return (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      // Prevent the user switching to another tab.
      // Otherwise, the local changes would be lost.
      setHasChanged(true);
      setResources(
        (previousResources: { [x: string]: cytoModel.resource.Resource }) => {
          // As we cannot directly modify it, we need to "produce" a new one
          return produce(
            previousResources,
            (draft: { [x: string]: cytoModel.resource.Resource }) => {
              // Update the given attribute with the new value
              _.set(draft, attr, event.target.value);
            }
          );
        }
      );
    };
  }, []);

  const deleteResource = useCallback(
    (key: string) => {
      const newResources = { ...resources };
      delete newResources[key];
      cy?.data("resources", newResources);
      updateGraph();
      setHasChanged(false);
    },
    [cy, resources, updateGraph]
  );

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
            handleChange={handleChange}
            deleteResource={deleteResource}
          />
        </TabPanel>
      ))}
      <TabPanel value={lastResourceIndex}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
          onClick={() => {
            const newResources = {
              ...resources,
              [uuid()]: cytoModel.resource.init(),
            };
            cy?.data("resources", newResources);
            updateGraph();
            setHasChanged(false);
          }}
        >
          Add Resource
        </Button>
      </TabPanel>
      {hasChanged && (
        <Stack justifyContent="space-around" direction="row" sx={{ width: 1 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<FontAwesomeIcon icon={faBan} />}
            onClick={() => {
              // Might have to clone object to force rerendering
              setResources(cyResources);
              setHasChanged(false);
            }}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            startIcon={<FontAwesomeIcon icon={faSave} />}
            onClick={() => {
              cy?.data("resources", resources);
              updateGraph();
              setHasChanged(false);
            }}
          >
            Save
          </Button>
        </Stack>
      )}
    </TabContext>
  );
}

function Resource({
  id,
  resource,
  index,
  handleChange,
  deleteResource,
}: {
  id: string;
  resource: cytoModel.resource.Resource;
  index: number;
  handleChange: any;
  deleteResource: (key: string) => void;
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Resource {index}</Typography>
      <TextField
        fullWidth
        multiline
        minRows={5}
        label="Text"
        value={resource.text}
        onChange={handleChange([id, "text"])}
      />
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
    </Stack>
  );
}

export default Resources;
