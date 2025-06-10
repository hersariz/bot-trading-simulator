import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Tabs, Tab, Paper } from '@mui/material';
import TestnetSettings from '../components/TestnetSettings';
import OrdersTab from '../components/testnet/OrdersTab';
import PositionsTab from '../components/testnet/PositionsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`testnet-tabpanel-${index}`}
      aria-labelledby={`testnet-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const TestnetPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Binance Testnet Integration
      </Typography>

      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="testnet tabs">
            <Tab label="Settings" id="testnet-tab-0" aria-controls="testnet-tabpanel-0" />
            <Tab label="Orders" id="testnet-tab-1" aria-controls="testnet-tabpanel-1" />
            <Tab label="Positions" id="testnet-tab-2" aria-controls="testnet-tabpanel-2" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <TestnetSettings />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <OrdersTab />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <PositionsTab />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default TestnetPage; 