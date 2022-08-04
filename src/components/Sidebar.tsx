import { Drawer, DrawerProps, useTheme } from "@mui/material";
import React from "react";

interface SidebarProps extends React.PropsWithChildren {
  side: DrawerProps["anchor"];
  drawerWidth: number;
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (x: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  side,
  drawerWidth,
  isMobile,
  isOpen,
  setIsOpen,
  children,
}) => {
  const theme = useTheme();
  return (
    <Drawer
      variant={isMobile ? "temporary" : "persistent"}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      anchor={side}
      sx={{
        height: "100vh",
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.easeIn,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: "0px",
        ...(isOpen && {
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          width: drawerWidth,
        }),
      }}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: drawerWidth,
        },
      }}
    >
      {children}
    </Drawer>
  );
};

export default Sidebar;
