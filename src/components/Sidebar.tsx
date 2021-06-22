import { Drawer, DrawerProps, duration } from "@material-ui/core";
import React from "react";

const Sidebar: React.FC<{
  side: DrawerProps["anchor"];
  drawerWidth: number;
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (x: boolean) => void;
}> = ({ side, drawerWidth, isMobile, isOpen, setIsOpen, children }) => {
  return (
    <Drawer
      sx={{ width: { md: drawerWidth }, height: "100vh" }}
      variant={isMobile ? "temporary" : "persistent"}
      open={isOpen || !isMobile}
      onClose={() => setIsOpen(false)}
      anchor={side}
      transitionDuration={
        isMobile
          ? { enter: duration.enteringScreen, exit: duration.leavingScreen }
          : 0
      }
      ModalProps={{ keepMounted: true }}
      PaperProps={{ sx: { width: drawerWidth } }}
    >
      {children}
    </Drawer>
  );
};

export default Sidebar;
