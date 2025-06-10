import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider,
  Grid,
  Chip,
  CircularProgress
} from '@mui/material';
import { ConfigType } from '../../types';
import { configService } from '../../services/api';

const ActiveConfig: React.FC = () => {
  const [config, setConfig] = useState<ConfigType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const data = await configService.getConfig();
        setConfig(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch config:', err);
        setError('Failed to load active configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
    
    // Refresh config every minute
    const intervalId = setInterval(fetchConfig, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !config) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography color="error">
          {error || 'No active configuration found'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Active Configuration
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Trading Pair
            </Typography>
            <Typography variant="h6">
              {config.symbol}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Timeframe
            </Typography>
            <Typography variant="h6">
              {config.timeframe}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Quantity
            </Typography>
            <Typography variant="h6">
              {config.quantity}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Leverage
            </Typography>
            <Typography variant="h6">
              {config.leverage}x
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" gutterBottom>
        Risk Management
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Stop Loss
            </Typography>
            <Typography variant="h6">
              {config.stopLossPercent}%
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Take Profit
            </Typography>
            <Typography variant="h6">
              {config.takeProfitPercent}%
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Trailing Stop
            </Typography>
            {config.trailingStop ? (
              <Chip 
                label={`Enabled (${config.trailingStopPercent}%)`} 
                color="success" 
                variant="outlined" 
              />
            ) : (
              <Chip 
                label="Disabled" 
                color="default" 
                variant="outlined" 
              />
            )}
          </Box>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" gutterBottom>
        Strategy Parameters
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              ADX Minimum
            </Typography>
            <Typography variant="h6">
              {config.adxMinimum}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              +DI Threshold
            </Typography>
            <Typography variant="h6">
              {config.plusDiThreshold}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary">
              -DI Threshold
            </Typography>
            <Typography variant="h6">
              {config.minusDiThreshold}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ActiveConfig; 