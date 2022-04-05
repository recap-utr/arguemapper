import { faInfoCircle, faParagraph } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  AppBar,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
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
          <Tooltip describeChild title="Toggle resource pane">
            <IconButton onClick={toggleLeft}>
              <FontAwesomeIcon icon={faParagraph} />
            </IconButton>
          </Tooltip>
          <Typography variant="h6">{config.name}</Typography>
          <Tooltip describeChild title="Toggle inspector">
            <IconButton onClick={toggleRight}>
              <FontAwesomeIcon icon={faInfoCircle} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
