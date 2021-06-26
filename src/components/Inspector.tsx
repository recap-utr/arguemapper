import { faBan, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Stack, Toolbar } from "@material-ui/core";
import React from "react";

function Inspector() {
  return (
    <Toolbar>
      <Stack justifyContent="space-around" direction="row" sx={{ width: 1 }}>
        <Button
          variant="outlined"
          startIcon={<FontAwesomeIcon icon={faSave} />}
        >
          Save
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<FontAwesomeIcon icon={faBan} />}
        >
          Cancel
        </Button>
      </Stack>
    </Toolbar>
  );
}

export default Inspector;
