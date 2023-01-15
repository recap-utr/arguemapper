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
import { useStore } from "../store.js";

export default function Header({
  toggleLeft,
  toggleRight,
}: {
  toggleLeft: () => void;
  toggleRight: () => void;
}) {
  const height = useStore((state) => state.headerHeight);

  return (
    <AppBar sx={{ position: "sticky", height: height }}>
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
          <Typography variant="h6">ArgueMapper</Typography>
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
