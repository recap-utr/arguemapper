import { faAnglesLeft, faAnglesRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppBar, IconButton, Toolbar, Tooltip, Typography } from "@mui/material";
import { useArgueActions, useArgueConfig, useStore } from "@/store.js";

export default function Header() {
  const height = useStore((state) => state.headerHeight);
  const side = useStore((state) => state.sidebarSide);
  const anyOpen = useStore((state) => state.sidebarSections.length > 0);
  const { sidebar } = useArgueConfig();
  const { closeSidebar } = useArgueActions();

  return (
    <AppBar position="sticky" sx={{ height }}>
      {/* Title stays absolutely centered so the optional collapse button never shifts it. */}
      <Toolbar sx={{ position: "relative", justifyContent: "center" }}>
        <Typography variant="h6">ArgueMapper</Typography>
        {sidebar && anyOpen && (
          <Tooltip describeChild title="Hide all panes">
            <IconButton
              color="inherit"
              onClick={closeSidebar}
              sx={{ position: "absolute", [side]: 8 }}
            >
              <FontAwesomeIcon icon={side === "right" ? faAnglesRight : faAnglesLeft} />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
    </AppBar>
  );
}
