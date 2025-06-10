import React from 'react';
import {
  Container,
  Typography,
  Box
} from '@mui/material';
import ConfigForm from '../components/config/ConfigForm';

const ConfigPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Strategy Configuration
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          Configure your trading strategy parameters. The bot will use these settings to execute trades based on DMI/ADX signals.
        </Typography>
      </Box>
      
      <ConfigForm />
    </Container>
  );
};

export default ConfigPage; 