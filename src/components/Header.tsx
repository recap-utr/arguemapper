import { faInfoCircle, faParagraph } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  AppBar,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@material-ui/core";
import config from "../config";

export default function Header({
  drawerWidth,
  toggleLeft,
  toggleRight,
}: {
  drawerWidth: number;
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
          <IconButton onClick={toggleLeft} sx={{ display: { md: "none" } }}>
            <FontAwesomeIcon icon={faParagraph} />
          </IconButton>
          <Typography variant="h6">{config.name}</Typography>
          <IconButton onClick={toggleRight} sx={{ display: { md: "none" } }}>
            <FontAwesomeIcon icon={faInfoCircle} />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
