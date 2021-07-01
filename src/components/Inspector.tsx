import { faBan, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Stack, TextField, Toolbar } from "@material-ui/core";
import cytoscape from "cytoscape";
import { set as _set } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import useStore from "../model/state";

// https://stackoverflow.com/a/44622467
class DefaultDict {
  constructor(defaultInit) {
    return new Proxy(
      {},
      {
        get: (target, name) =>
          name in target
            ? target[name]
            : (target[name] =
                typeof defaultInit === "function"
                  ? new defaultInit().valueOf()
                  : defaultInit),
      }
    );
  }
}

function Inspector({ cy }: { cy: cytoscape.Core }) {
  const { updateGraph } = useStore();
  // @ts-ignore
  const [element, setElement] = useState(cy?.data());

  useEffect(() => {
    if (cy) {
      cy.on("select", (e) => {
        setElement(e.target.data());
      });
      cy.on("unselect", (e) => {
        // @ts-ignore
        setElement(cy?.data());
      });
    }
  }, [cy]);

  const handleChange = useCallback(
    (attr: string | string[]) => {
      // We need to return a function here, thus the nested callbacks
      return (event: React.ChangeEvent<HTMLInputElement>) => {
        cy.elements().unselectify();

        setElement((element) => {
          const newElem = { ...element };
          _set(newElem, attr, event.target.value);
          return newElem;
        });
      };
    },
    [cy, setElement]
  );

  let fields = null;

  if (element) {
    if (!element.kind) {
      // edge
    } else if (element.kind === "scheme") {
      // s-node
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
    }
  }

  return (
    <>
      <Toolbar>
        <Stack justifyContent="space-around" direction="row" sx={{ width: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FontAwesomeIcon icon={faSave} />}
            onClick={() => {
              if (element) {
                const cytoElem = cy.$id(element.id);
                cytoElem.removeData();
                cytoElem.data(element);
              }

              // TODO: Undo/redo does not work as expected
              updateGraph(cy);
            }}
          >
            Save
          </Button>
          <Button
            variant="outlined"
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
