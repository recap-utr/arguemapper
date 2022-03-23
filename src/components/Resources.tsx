import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Stack, Tab, TextField, Typography } from "@mui/material";
import React from "react";

function Resources({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (v: string) => void;
}) {
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };
  // const {} = useGraph();

  return (
    <TabContext value={activeTab}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <TabList
          onChange={handleChange}
          aria-label="resource list"
          variant="scrollable"
          scrollButtons={true}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
            <Tab key={key} label={key} value={key} sx={{ minWidth: 50 }} />
          ))}
        </TabList>
      </Box>
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
        <TabPanel key={key} value={key}>
          <Resource id={key} />
        </TabPanel>
      ))}
    </TabContext>
  );
}

function Resource({ id }: { id: string }) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Resource {id}</Typography>
      <TextField fullWidth multiline minRows={5} label="Text" />
    </Stack>
  );
}

export default Resources;
