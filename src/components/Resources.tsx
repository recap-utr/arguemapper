import { faPlusCircle, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Button, Stack, Tab, TextField, Typography } from "@mui/material";
import produce from "immer";
import React, { useCallback, useState } from "react";
import { useViewport } from "react-flow-renderer";
// @ts-ignore
import { HighlightWithinTextarea } from "react-highlight-within-textarea";
import * as model from "../model";
import useStore, { State } from "../store";

interface TextSelection {
  anchor: number;
  focus: number;
}

interface Props {}

const Resources: React.FC<Props> = () => {
  const setState = useStore((state) => state.setState);
  const references = useStore((state) =>
    Object.fromEntries(
      state.nodes
        .filter((node) => model.isAtom(node) && node.data.reference)
        .map((node) => [
          node.id,
          (node.data as model.AtomData).reference as model.Reference,
        ])
    )
  );
  const resources = useStore((state) => state.graph.resources);
  const [activeTab, setActiveTab] = useState("1");

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      setActiveTab(newValue);
    },
    []
  );

  const addResource = useCallback(() => {
    setState(
      produce((draft: State) => {
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
      {Object.entries(resources).map(([id, resource], index) => (
        <TabPanel key={index + 1} value={(index + 1).toString()}>
          <Resource
            id={id}
            index={index + 1}
            resource={resource}
            references={references}
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
};

interface ResourceProps {
  id: string;
  resource: model.Resource;
  index: number;
  references: { [k: string]: model.Reference };
}

const Resource: React.FC<ResourceProps> = ({
  id,
  resource,
  index,
  references,
}) => {
  const setState = useStore((state) => state.setState);
  const { x, y } = useViewport();

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
    (value: string, selection?: TextSelection) => {
      if (selection !== undefined && value === resource.text) {
        const start = Math.min(selection.anchor, selection.focus);
        const end = Math.max(selection.anchor, selection.focus);
        setUserSelection({ anchor: start, focus: end });
        setSystemSelection(undefined);
      } else {
        setState(
          produce((draft: State) => {
            draft.graph.resources[id].text = value;
          })
        );
      }
    },
    [id, resource.text, setState]
  );

  // const onBlur = useCallback(() => {
  //   setState(
  //     produce((draft) => {
  //       draft.graph.resources[id] = resource;
  //     })
  //   );
  // }, [setState, id, resource]);

  const addAtom = useCallback(() => {
    const text = resource.text.substring(
      userSelection.anchor,
      userSelection.focus
    );
    const offset = userSelection.anchor;

    const node = model.initAtom({
      text,
      reference: model.initReference({ offset, text, resource: id }),
      position: { x, y },
    });
    node.selected = true;

    setState(
      produce((draft: State) => {
        draft.nodes.push(node);
      })
    );
  }, [
    resource.text,
    userSelection.anchor,
    userSelection.focus,
    id,
    x,
    y,
    setState,
  ]);

  const deleteResource = useCallback(() => {
    setState(
      produce((draft: State) => {
        delete draft.graph.resources[id];
      })
    );
  }, [id, setState]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Resource {index}</Typography>
      <TextField
        hiddenLabel
        fullWidth
        multiline
        minRows={5}
        value={resource.text}
        onChange={onChange as any}
        InputProps={{
          inputComponent: HighlightWithinTextarea as any,
          inputProps: {
            selection: systemSelection,
            highlight,
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
      {/* <Button
        fullWidth
        variant="contained"
        startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
        onClick={() => {
          setState(
            produce((draft: State) => {
              draft.graph.resources[id].text =
                draft.graph.resources[id].text + " Hello";
            })
          );
        }}
      >
        DEBUG: Append text
      </Button> */}
    </Stack>
  );
};

export default Resources;
