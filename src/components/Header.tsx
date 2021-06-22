import {
    AppBar, IconButton, Stack, Toolbar, Typography
} from "@material-ui/core";
import { Menu } from "@material-ui/icons";

export default function Header({drawerWidth, toggleLeft, toggleRight}: {drawerWidth: number, toggleLeft: () => void, toggleRight: () => void}) {
    return <AppBar
        sx={{
            width: { md: `calc(100% - 2*${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            mr: { md: `${drawerWidth}px` },
        }}
    >
        <Toolbar>
            <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
            <IconButton
                onClick={toggleLeft}
                // sx={{ display: { md: "none" } }}
            >
                <Menu />
            </IconButton>
            <Typography variant="h6">Header</Typography>
            <IconButton
                onClick={toggleRight}
                // sx={{ display: { md: "none" } }}
            >
                <Menu />
            </IconButton></Stack>
        </Toolbar>
    </AppBar>
}
