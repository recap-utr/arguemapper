import { faInfoCircle, faParagraph } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppBar, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import config from "../config";

export default function Header({
  toggleLeft,
  toggleRight,
}: {
  toggleLeft: () => void;
  toggleRight: () => void;
}) {
  return (
    <AppBar sx={{ position: "sticky" }}>
      <Toolbar>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          textAlign="center"
        >
          <IconButton onClick={toggleLeft}>
            <FontAwesomeIcon icon={faParagraph} />
          </IconButton>
          <Typography variant="h6">{config.name}</Typography>
          <IconButton onClick={toggleRight}>
            <FontAwesomeIcon icon={faInfoCircle} />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
