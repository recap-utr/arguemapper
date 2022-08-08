import { faPlusCircle, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Button, Stack, Tab, TextField, Typography } from "@mui/material";
import produce from "immer";
import React, { useCallback, useState } from "react";
import { useViewport } from "react-flow-renderer";
import { HighlightWithinTextarea } from "react-highlight-within-textarea";
import * as model from "../model";
import { useGraph } from "./GraphContext";

interface TextSelection {
  anchor: number;
  focus: number;
}

interface Props {}

const Resources: React.FC<Props> = () => {
  const { state, setState } = useGraph();
  const resources = state.graph.resources;
  const [activeTab, setActiveTab] = useState("1");

  const references = Object.fromEntries(
    state.nodes
      .filter((node) => model.isAtom(node) && node.data.reference)
      .map((node) => [
        node.id,
        (node.data as model.AtomData).reference as model.Reference,
      ])
  );

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      setActiveTab(newValue);
    },
    []
  );

  const addResource = useCallback(() => {
    setState(
      produce((draft) => {
        draft.graph.resources[model.uuid()] = model.initResource({ text: "" });
      })
    );
  }, [setState]);

  const lastResourceIndex = (Object.keys(resources).length + 1).toString();

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
          <Resource id={key} index={index + 1} references={references} />
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
};

interface ResourceProps {
  id: string;
  index: number;
  references: { [k: string]: model.Reference };
}

const Resource: React.FC<ResourceProps> = ({ id, index, references }) => {
  const { setGraph, graph, setState } = useGraph();
  const { x, y } = useViewport();
  const resource: model.Resource = graph.resources[id];

  const [userSelection, setUserSelection] = useState<TextSelection>({
    anchor: 0,
    focus: 0,
  });
  const [systemSelection, setSystemSelection] = useState<
    TextSelection | undefined
  >(undefined);

  const highlight = useCallback(
    (text: string, callback: (start: number, end: number) => void) => {
      const filteredReferences = Object.values(references).filter(
        (reference) => reference.resource === id
      );

      for (const reference of filteredReferences) {
        const start = reference.offset;

        if (start !== undefined) {
          const end = start + reference.text.length;

          if (end && text.substring(start, end) === reference.text) {
            callback(start, end);
          }
        }
      }
    },
    [id, references]
  );

  const onChange = useCallback(
    (value: string, selection: TextSelection) => {
      if (value === resource.text) {
        const start = Math.min(selection.anchor, selection.focus);
        const end = Math.max(selection.anchor, selection.focus);
        setUserSelection({ anchor: start, focus: end });
        setSystemSelection(undefined);
      } else {
        setGraph(
          produce((draft) => {
            draft.resources[id].text = value;
          })
        );
      }
    },
    [setGraph, id, resource]
  );

  const onBlur = useCallback(() => {
    setState(
      produce((draft) => {
        draft.graph.resources[id] = resource;
      })
    );
  }, [setState, id, resource]);

  const addAtom = useCallback(() => {
    const text = resource.text.substring(
      userSelection.anchor,
      userSelection.focus
    );
    console.log({
      resource,
      text,
    });
    const offset = userSelection.anchor;

    const node = model.initAtom({
      text,
      reference: model.initReference({ offset, text, resource: id }),
      position: { x, y },
    });
    node.selected = true;

    setState(
      produce((draft) => {
        draft.nodes.push(node);
      })
    );
  }, [resource, userSelection, setState, id, x, y]);

  const deleteResource = useCallback(() => {
    setState(
      produce((draft) => {
        delete draft.graph.resources[id];
      })
    );
  }, [setState, id]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Resource {index}</Typography>
      <TextField
        hiddenLabel
        fullWidth
        multiline
        minRows={5}
        value={resource?.text ?? ""}
        onChange={onChange as any}
        InputProps={{
          inputComponent: HighlightWithinTextarea as any,
          inputProps: {
            selection: systemSelection,
            highlight,
            onBlur,
          },
        }}
      />
      <Button
        fullWidth
        variant="contained"
        color="error"
        startIcon={<FontAwesomeIcon icon={faTrash} />}
        onClick={deleteResource}
      >
        Delete Resource
      </Button>
      <Button
        fullWidth
        variant="contained"
        startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
        onClick={addAtom}
      >
        Add selected text
      </Button>
    </Stack>
  );
};

export default Resources;
