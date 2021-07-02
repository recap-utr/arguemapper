import { faBan, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Stack, TextField, Toolbar } from "@material-ui/core";
import cytoscape from "cytoscape";
import _ from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import useStore from "../model/cytoStore";

function Inspector({ cy }: { cy: cytoscape.Core }) {
  const { updateGraph } = useStore();
  // @ts-ignore
  const [element, setElement] = useState(_.cloneDeep(cy?.data()));

  useEffect(() => {
    if (cy) {
      cy.on("select", (e) => {
        // setElement(_.cloneDeep(e.target.data()));
        setElement({ kind: "atom", text: "hello", id: "a1" });
      });
      cy.on("unselect", (e) => {
        if (cy) {
          // @ts-ignore
          setElement(_.cloneDeep(cy.data()));
        } else {
          setElement(null);
        }
      });
    }
  }, [cy]);

  const handleChange = useCallback(
    (attr: string | string[]) => {
      // We need to return a function here, thus the nested callbacks
      return (event: React.ChangeEvent<HTMLInputElement>) => {
        cy.elements().unselectify();

        setElement((element) => {
          const newElem = _.cloneDeep(element);
          _.set(newElem, attr, event.target.value);
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
            variant="contained"
            startIcon={<FontAwesomeIcon icon={faSave} />}
            onClick={() => {
              if (element) {
                console.log(element);
                const cytoElem = cy.$id(element.id);
                cytoElem.removeData();
                cytoElem.data(element);
              }

              cy.elements().selectify();
              updateGraph(cy);
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
