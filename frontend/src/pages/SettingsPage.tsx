import React from 'react';
import {
  Container,
  Typography,
  Box,
  Divider
} from '@mui/material';
import BinanceApiSettings from '../components/settings/BinanceApiSettings';

const SettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Pengaturan
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          Konfigurasi pengaturan aplikasi dan koneksi API.
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      <BinanceApiSettings />
    </Container>
  );
};

export default SettingsPage; 