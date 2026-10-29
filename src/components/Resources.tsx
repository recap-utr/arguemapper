import { faPlusCircle, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import * as arguebuf from "arguebuf";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { shallow } from "zustand/shallow";
import * as model from "@/model.js";
import { type State, useArgueActions, useStore } from "@/store.js";
import { HighlightTextarea, type HighlightRange } from "@/components/HighlightTextarea.js";
import { SectionHeader } from "@/components/sidebar/SectionHeader.js";

interface Props {
  onClose: () => void;
}

/** The atom if it is the only selected element. */
function selectedAtom({ graph, selection }: State): model.AtomNode | undefined {
  const node =
    selection.nodes.length === 1 && selection.edges.length === 0
      ? graph.nodes[selection.nodes[0]]
      : undefined;

  return node?.type === "atom" ? node : undefined;
}

const selectAtomSelected = (state: State): boolean => selectedAtom(state) !== undefined;

// graph edits keep unchanged elements, so references are compared by identity
const selectSelectedReference = (state: State): arguebuf.Reference | undefined =>
  selectedAtom(state)?.reference;

function computeHighlightRanges(
  text: string,
  references: readonly arguebuf.Reference[],
  resourceId: string,
  atomSelected: boolean,
  selectedReference: arguebuf.Reference | undefined,
): HighlightRange[] {
  const range = ({ resource, text: quote, offset }: arguebuf.Reference): HighlightRange | undefined =>
    resource === resourceId && offset !== undefined && arguebuf.isAnchored(text, quote, offset)
      ? [offset, offset + quote.length]
      : undefined;

  // While a single atom is selected, highlight only its own reference, if any.
  if (atomSelected) {
    const selected = selectedReference && range(selectedReference);
    return selected ? [selected] : [];
  }

  const ranges = references
    .flatMap((reference) => {
      const value = range(reference);
      return value === undefined ? [] : [value];
    })
    .sort((a, b) => a[0] - b[0]);

  // Merge overlapping ranges so adjacent highlights render as one.
  const merged: [number, number][] = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

// the add tab is not a resource, but MUI tabs need a value for it
const NEW_RESOURCE = "###NEW###";

const Resources: React.FC<Props> = ({ onClose }) => {
  // moving nodes keeps their references, so the highlights are not recomputed
  const references = useStore(
    (state) =>
      Object.values(state.graph.nodes).flatMap((node) =>
        node.type === "atom" && node.reference !== undefined ? [node.reference] : [],
      ),
    shallow,
  );
  const resourceIds = useStore((state) => Object.keys(state.graph.resources), shallow);
  const selectedReference = useStore(selectSelectedReference);
  const shown = useStore((state) => model.shownResource(state.graph, state.selectedResource));
  const { setState, setStateWithoutHistory, editGraph } = useArgueActions();

  // Reveal the resource a selected atom references so its highlight is visible.
  useEffect(() => {
    const resourceId = selectedReference?.resource;
    if (resourceId !== undefined) setStateWithoutHistory({ selectedResource: resourceId });
  }, [selectedReference, setStateWithoutHistory]);

  const addResource = useCallback(() => {
    const resource = new arguebuf.Resource({ text: "" });
    editGraph((graph) => {
      graph.addResource(resource);

      return { selectedResource: resource.id };
    });
  }, [editGraph]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, value: string) => {
      if (value === NEW_RESOURCE) {
        addResource();
      } else {
        setState({ selectedResource: value });
      }
    },
    [setState, addResource],
  );

  return (
    <>
      <SectionHeader title="Resources" onClose={onClose} />
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={shown ?? false}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons={true}
          >
            {resourceIds.map((id, index) => (
              <Tab key={id} label={index + 1} value={id} sx={{ minWidth: 50 }} />
            ))}
            <Tab
              icon={<FontAwesomeIcon icon={faPlusCircle} />}
              aria-label="Add Resource"
              value={NEW_RESOURCE}
              sx={{ minWidth: 50 }}
            />
          </Tabs>
        </Box>
        <Box role="tabpanel" sx={{ p: 3 }}>
          {shown !== undefined ? (
            <Resource
              key={shown}
              id={shown}
              index={resourceIds.indexOf(shown) + 1}
              references={references}
            />
          ) : (
            <Button
              fullWidth
              variant="contained"
              startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
              onClick={addResource}
            >
              Add Resource
            </Button>
          )}
        </Box>
      </Box>
    </>
  );
};

interface ResourceProps {
  id: string;
  index: number;
  references: readonly arguebuf.Reference[];
}

const Resource: React.FC<ResourceProps> = ({ id, index, references }) => {
  const resource = useStore((state) => state.graph.resources[id]);
  const atomSelected = useStore(selectAtomSelected);
  const selectedReference = useStore(selectSelectedReference);
  const { editGraph, addNodeAt } = useArgueActions();

  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });

  const ranges = useMemo(
    () => computeHighlightRanges(resource.text, references, id, atomSelected, selectedReference),
    [resource.text, references, id, atomSelected, selectedReference],
  );

  // When an atom is selected `ranges` holds only its own reference, if any.
  const revealRange = selectedReference ? ranges[0] : undefined;

  const updateField = useCallback(
    (field: "title" | "text" | "source") =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { value } = event.target;
        editGraph((graph) => {
          // re-anchors the references if the text changes
          graph.updateResource(id, { [field]: value });
        });
      },
    [id, editGraph],
  );

  const addAtom = useCallback(() => {
    const text = resource.text.substring(textSelection.start, textSelection.end);
    const reference = new arguebuf.Reference({ offset: textSelection.start, text, resource: id });
    addNodeAt(new arguebuf.AtomNode({ text, reference }));
    // Clearing collapses the button back to disabled so the same span can't be
    // added twice by accident; a fresh selection re-enables it.
    setTextSelection({ start: 0, end: 0 });
  }, [resource.text, textSelection, id, addNodeAt]);

  const handleSelectionChange = useCallback((start: number, end: number) => {
    setTextSelection({ start, end });
  }, []);

  const deleteResource = useCallback(() => {
    editGraph((graph) => {
      graph.removeResource(id);
    });
  }, [id, editGraph]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Resource {index}</Typography>
      <TextField fullWidth label="Title" value={resource.title} onChange={updateField("title")} />
      <TextField
        label="Text"
        fullWidth
        multiline
        rows={5}
        value={resource.text}
        onChange={updateField("text")}
        slots={{ htmlInput: HighlightTextarea }}
        slotProps={{
          htmlInput: {
            ranges,
            revealRange,
            onSelectionChange: handleSelectionChange,
          },
        }}
      />
      <TextField
        fullWidth
        label="Source"
        value={resource.source}
        onChange={updateField("source")}
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
        disabled={textSelection.start === textSelection.end}
        startIcon={<FontAwesomeIcon icon={faPlusCircle} />}
        onClick={addAtom}
      >
        Add selected text
      </Button>
    </Stack>
  );
};

export default Resources;
