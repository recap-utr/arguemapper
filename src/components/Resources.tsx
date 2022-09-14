import { faPlusCircle, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Button, Stack, Tab, TextField, Typography } from "@mui/material";
import { dequal } from "dequal";
import produce from "immer";
import React, { useCallback, useMemo, useState } from "react";
import {
  HighlightWithinTextarea,
  Selection as TextSelection,
} from "react-highlight-within-textarea";
import { useViewport } from "reactflow";
import * as model from "../model";
import useStore, { State } from "../store";

interface Props {}

const Resources: React.FC<Props> = () => {
  const setState = useStore((state) => state.setState);
  const references = useStore(
    (state) =>
      Object.fromEntries(
        state.nodes
          .filter((node) => model.isAtom(node) && node.data.reference)
          .map((node) => [
            node.id,
            (node.data as model.AtomData).reference as model.Reference,
          ])
      ),
    dequal
  );
  const resourceIds = useStore(
    (state) => Object.keys(state.graph.resources),
    dequal
  );
  const activeTab = useStore((state) => state.selectedResource);
  const setActiveTab = useCallback(
    (value: string) => {
      setState({ selectedResource: value });
    },
    [setState]
  );

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      setActiveTab(newValue);
    },
    [setActiveTab]
  );

  const addResource = useCallback(() => {
    setState(
      produce((draft: State) => {
        draft.graph.resources[model.uuid()] = model.initResource({ text: "" });
      })
    );
  }, [setState]);

  const lastResourceIndex = useMemo(
    () => (resourceIds.length + 1).toString(),
    [resourceIds]
  );

  return (
    <TabContext value={activeTab}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <TabList
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons={true}
        >
          {resourceIds.map((key, index) => (
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
      {resourceIds.map((id, index) => (
        <TabPanel key={index + 1} value={(index + 1).toString()}>
          <Resource id={id} index={index + 1} references={references} />
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
  const resource = useStore((state) => state.graph.resources[id]);
  const setState = useStore((state) => state.setState);
  const selection = useStore((state) => state.selection);
  const { x, y } = useViewport();

  const [userSelection, setUserSelection] = useState<TextSelection>(
    new TextSelection(0, 0)
  );

  const [systemSelection, setSystemSelection] = useState<
    TextSelection | undefined
  >(undefined);

  const highlight = useCallback(
    (text: string, callback: (start: number, end: number) => void) => {
      if (selection.type === "atom") {
        const selectedAtom = useStore.getState().nodes[
          selection.nodes[0]
        ] as model.AtomNode;
        const selectedReference = selectedAtom.data.reference;

        if (
          selectedReference !== undefined &&
          selectedReference.offset !== undefined &&
          selectedReference.text.length > 0
        ) {
          callback(
            selectedReference.offset,
            selectedReference.offset + selectedReference.text.length
          );
          return;
        }
      }

      const raw = Object.values(references)
        .filter((ref) => ref.resource === id)
        .map((ref) => {
          const start = ref.offset;
          const end = start !== undefined ? start + ref.text.length : undefined;

          if (
            start !== undefined &&
            end !== undefined &&
            text.substring(start, end) === ref.text
          ) {
            return [start, end];
          }

          return undefined;
        })
        .filter((entry): entry is number[] => entry !== undefined)
        .sort((a, b) => a[0] - b[0]);

      const merged = [] as number[][];
      const firstHighlight = raw.shift();

      if (firstHighlight !== undefined) {
        merged.push(firstHighlight);

        raw.forEach(([nextStart, nextEnd]) => {
          const lastIndex = merged.length - 1;
          const [prevStart, prevEnd] = merged[lastIndex];

          if (nextStart > prevEnd) {
            merged.push([nextStart, nextEnd]);
          } else if (nextEnd > prevEnd) {
            merged[lastIndex] = [prevStart, nextEnd];
          }
        });
      }

      merged.forEach(([start, end]) => {
        callback(start, end);
      });
    },
    [id, references, selection]
  );

  const onChange = useCallback(
    (value: string, selection?: TextSelection) => {
      setSystemSelection(undefined);

      if (selection !== undefined && value === resource.text) {
        const start = Math.min(selection.anchor, selection.focus);
        const end = Math.max(selection.anchor, selection.focus);
        setUserSelection(new TextSelection(start, end));
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
    </Stack>
  );
};

export default Resources;
