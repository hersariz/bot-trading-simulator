import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  Grid,
  Alert,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { testAPIConnection, testMarketDataAPI, testOrdersAPI } from '../utils/testAPI';

const TestPage: React.FC = () => {
  const [configApiStatus, setConfigApiStatus] = useState<{ success?: boolean; message?: string; loading: boolean }>({
    loading: false
  });
  
  const [marketDataApiStatus, setMarketDataApiStatus] = useState<{ success?: boolean; message?: string; loading: boolean; data?: any }>({
    loading: false
  });
  
  const [ordersApiStatus, setOrdersApiStatus] = useState<{ success?: boolean; message?: string; loading: boolean; data?: any }>({
    loading: false
  });
  
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  const handleTestConfigAPI = async () => {
    setConfigApiStatus({ loading: true });
    const result = await testAPIConnection();
    setConfigApiStatus({
      success: result.success,
      message: result.message,
      loading: false
    });
  };

  const handleTestMarketDataAPI = async () => {
    setMarketDataApiStatus({ loading: true });
    const result = await testMarketDataAPI(symbol);
    setMarketDataApiStatus({
      success: result.success,
      message: result.message,
      data: result.data,
      loading: false
    });
  };

  const handleTestOrdersAPI = async () => {
    setOrdersApiStatus({ loading: true });
    const result = await testOrdersAPI();
    setOrdersApiStatus({
      success: result.success,
      message: result.message,
      data: result.data,
      loading: false
    });
  };

  const handleTestAllAPI = async () => {
    await handleTestConfigAPI();
    await handleTestMarketDataAPI();
    await handleTestOrdersAPI();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        API Testing & Debugging
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          Gunakan halaman ini untuk menguji koneksi antara frontend dan backend API.
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Test API Connections
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleTestAllAPI}
                sx={{ mr: 2 }}
              >
                Test All API Connections
              </Button>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Config API
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={handleTestConfigAPI}
                  disabled={configApiStatus.loading}
                  sx={{ mb: 2 }}
                >
                  {configApiStatus.loading ? <CircularProgress size={24} /> : 'Test Config API'}
                </Button>
                
                {configApiStatus.message && (
                  <Alert 
                    severity={configApiStatus.success ? 'success' : 'error'}
                    sx={{ mt: 2 }}
                  >
                    {configApiStatus.message}
                  </Alert>
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Market Data API
                </Typography>
                
                <TextField
                  label="Symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 2, mr: 2 }}
                />
                
                <Button 
                  variant="outlined" 
                  onClick={handleTestMarketDataAPI}
                  disabled={marketDataApiStatus.loading}
                  sx={{ mb: 2 }}
                >
                  {marketDataApiStatus.loading ? <CircularProgress size={24} /> : 'Test Market Data API'}
                </Button>
                
                {marketDataApiStatus.message && (
                  <Alert 
                    severity={marketDataApiStatus.success ? 'success' : 'error'}
                    sx={{ mt: 2 }}
                  >
                    {marketDataApiStatus.message}
                  </Alert>
                )}
                
                {marketDataApiStatus.success && marketDataApiStatus.data && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
                    <Typography variant="subtitle2">Response Data:</Typography>
                    <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                      {JSON.stringify(marketDataApiStatus.data, null, 2)}
                    </pre>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Orders API
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={handleTestOrdersAPI}
                  disabled={ordersApiStatus.loading}
                  sx={{ mb: 2 }}
                >
                  {ordersApiStatus.loading ? <CircularProgress size={24} /> : 'Test Orders API'}
                </Button>
                
                {ordersApiStatus.message && (
                  <Alert 
                    severity={ordersApiStatus.success ? 'success' : 'error'}
                    sx={{ mt: 2 }}
                  >
                    {ordersApiStatus.message}
                  </Alert>
                )}
                
                {ordersApiStatus.success && ordersApiStatus.data && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
                    <Typography variant="subtitle2">Response Data:</Typography>
                    <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                      {JSON.stringify(ordersApiStatus.data, null, 2)}
                    </pre>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Common Issues & Troubleshooting
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText 
                  primary="CORS Error" 
                  secondary="Jika terjadi CORS error, pastikan backend Anda telah mengaktifkan CORS untuk frontend URL. Periksa file app.js pada backend untuk memastikan middleware CORS sudah diimplementasikan."
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Network Error" 
                  secondary="Jika terjadi network error, pastikan server backend sedang berjalan dan URL yang digunakan benar. Periksa file .env untuk memastikan REACT_APP_API_URL diatur dengan benar."
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="404 Not Found" 
                  secondary="Jika endpoint tidak ditemukan, periksa apakah path yang digunakan dalam API request sudah benar dan endpoint tersebut sudah diimplementasikan di backend."
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Data Format Error" 
                  secondary="Jika terjadi error pada format data, pastikan tipe data yang dikirim dan diterima oleh frontend dan backend sudah sesuai."
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TestPage; 