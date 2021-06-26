import { Drawer, DrawerProps, useTheme } from "@material-ui/core";
import React from "react";

const Sidebar: React.FC<{
  side: DrawerProps["anchor"];
  drawerWidth: number;
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (x: boolean) => void;
}> = ({ side, drawerWidth, isMobile, isOpen, setIsOpen, children }) => {
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
          position: "sticky",
          width: drawerWidth,
        },
      }}
    >
      {children}
    </Drawer>
  );
};

export default Sidebar;
