import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import ActiveConfig from '../components/config/ActiveConfig';
import OrderList from '../components/orders/OrderList';
import { marketService } from '../services/api';
import { MarketDataType } from '../types';

const Dashboard: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketDataType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(60);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        const data = await marketService.getMarketData('BTCUSDT');
        
        // Transform received data to match MarketDataType
        const transformedData: MarketDataType = {
          symbol: data.symbol || 'BTCUSDT',
          // API mungkin mengembalikan price sebagai currentPrice
          price: data.price || data.currentPrice || 0,
          // API mungkin mengembalikan timestamp sebagai string ISO atau objek Date
          timestamp: data.timestamp ? 
            (typeof data.timestamp === 'string' ? new Date(data.timestamp).getTime() : data.timestamp) : 
            Date.now()
        };
        
        setMarketData(transformedData);
        setError(null);
        setRefreshCountdown(60); // Reset countdown after successful refresh
      } catch (err) {
        console.error('Failed to fetch market data:', err);
        setError('Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    // Fetch data initially
    fetchMarketData();
    
    // Refresh market data every 60 seconds
    const refreshInterval = 60;
    const intervalId = setInterval(fetchMarketData, refreshInterval * 1000);
    
    // Countdown timer for next refresh
    const countdownId = setInterval(() => {
      setRefreshCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(countdownId);
    };
  }, []);

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return '-';
    
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (timestamp: number | undefined) => {
    if (timestamp === undefined || timestamp === null) return '-';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Trading Bot Simulator
      </Typography>
      
      <Grid container spacing={3}>
        {/* Market Data */}
        <Grid size={12}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Market Data
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : marketData ? (
              <>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Symbol
                      </Typography>
                      <Typography variant="h6">
                        {marketData.symbol || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Current Price
                      </Typography>
                      <Typography variant="h6">
                        ${formatPrice(marketData.price)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="h6">
                        {formatDate(marketData.timestamp)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Refreshing in {refreshCountdown} seconds
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(refreshCountdown / 60) * 100} 
                    sx={{ height: 4, mt: 0.5 }}
                  />
                </Box>
              </>
            ) : (
              <Typography color="text.secondary">No market data available</Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Active Configuration */}
        <Grid size={12}>
          <ActiveConfig />
        </Grid>
        
        {/* Order History */}
        <Grid size={12}>
          <OrderList />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 