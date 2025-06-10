import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid as MuiGrid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import api, { testnetService } from '../services/api';

interface TestnetConfig {
  apiKey: string;
  apiSecret: string;
  type: 'spot' | 'futures';
  isConfigured: boolean;
}

// Buat komponen Grid yang lebih sederhana untuk mengatasi kesalahan tipe
const Grid = (props: any) => <MuiGrid {...props} />;

const TestnetSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);
  const [config, setConfig] = useState<TestnetConfig>({
    apiKey: '',
    apiSecret: '',
    type: 'futures',
    isConfigured: false,
  });
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiSecret, setNewApiSecret] = useState('');
  const [newType, setNewType] = useState('futures');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [accountBalance, setAccountBalance] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Fetch current config on component mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      // Gunakan testnetService yang baru
      const response = await testnetService.getConfig();
      if (response && response.apiKey) {
        setConfig(response);
        setNewType(response.type || 'futures');
      }
    } catch (error: any) {
      console.error('Error fetching testnet config:', error);
      setMessage({
        type: 'error',
        text: `Error fetching testnet config: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!newApiKey || !newApiSecret) {
      setMessage({ type: 'error', text: 'API Key and Secret are required' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Log untuk debugging
      console.log('Sending request to server:', {
        apiKey: newApiKey.substring(0, 10) + '...',
        apiSecret: 'HIDDEN',
        type: newType
      });
      
      // Gunakan testnetService yang baru
      const response = await testnetService.updateConfig({
        apiKey: newApiKey,
        apiSecret: newApiSecret,
        type: newType,
      });

      console.log('Server response:', response);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Testnet configuration saved successfully' });
        fetchConfig();
        setNewApiKey('');
        setNewApiSecret('');
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to save configuration' });
      }
    } catch (error: any) {
      console.error('Error saving testnet config:', error);
      console.error('Response data:', error.response?.data);
      console.error('Status code:', error.response?.status);
      
      setMessage({
        type: 'error',
        text: `Error saving testnet config: ${error.response?.data?.error || error.message || 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoadingTest(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Gunakan testnetService yang baru
      const response = await testnetService.testConnection();
      
      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Successfully connected to Binance Testnet'
        });
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Failed to connect to Testnet'
        });
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      setMessage({
        type: 'error',
        text: `Error testing connection: ${error.message || 'Unknown error'}`
      });
    } finally {
      setLoadingTest(false);
    }
  };

  const fetchBalance = async () => {
    setBalanceLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Gunakan testnetService yang baru
      const response = await testnetService.getBalance();
      
      if (response.success) {
        console.log('Balance data received:', response.data);
        // Menyimpan balance data untuk ditampilkan
        setAccountBalance(response.data);
        setMessage({
          type: 'success',
          text: 'Successfully retrieved account balance'
        });
      } else {
        setMessage({
          type: 'error',
          text: response.error || 'Failed to get account balance'
        });
      }
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      setMessage({
        type: 'error',
        text: `Error fetching balance: ${error.response?.data?.error || error.message || 'Unknown error'}`
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Binance Testnet Settings
        </Typography>
        
        {message.text && (
          <Alert severity={message.type as 'success' | 'error' | 'info' | 'warning'} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Current Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="API Key"
                    value={config.apiKey || 'Not configured'}
                    fullWidth
                    disabled
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="API Secret"
                    value={config.apiSecret || 'Not configured'}
                    fullWidth
                    disabled
                    margin="normal"
                    type="password"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Type"
                    value={config.type || 'futures'}
                    fullWidth
                    disabled
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Status"
                    value={config.isConfigured ? 'Configured' : 'Not configured'}
                    fullWidth
                    disabled
                    margin="normal"
                  />
                </Grid>
              </Grid>

              {config.isConfigured && (
                <Box mt={2} display="flex" gap={2}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={testConnection}
                    disabled={loadingTest}
                  >
                    {loadingTest ? <CircularProgress size={24} /> : 'Test Connection'}
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={fetchBalance}
                    disabled={balanceLoading}
                  >
                    {balanceLoading ? <CircularProgress size={24} /> : 'Get Balance'}
                  </Button>
                </Box>
              )}
              
              {accountBalance && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>
                    Account Balance
                  </Typography>
                  <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                    {config.type === 'futures' ? (
                      <Grid container spacing={2}>
                        {accountBalance.balances?.map((asset: any, index: number) => (
                          asset.walletBalance > 0 && (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="h6">{asset.asset}</Typography>
                                  <Typography>Wallet: {parseFloat(asset.walletBalance).toFixed(6)}</Typography>
                                  <Typography>Available: {parseFloat(asset.availableBalance).toFixed(6)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          )
                        ))}
                      </Grid>
                    ) : (
                      <Grid container spacing={2}>
                        {accountBalance.balances?.map((asset: any, index: number) => (
                          (parseFloat(asset.free) > 0 || parseFloat(asset.locked) > 0) && (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="h6">{asset.asset}</Typography>
                                  <Typography>Free: {parseFloat(asset.free).toFixed(6)}</Typography>
                                  <Typography>Locked: {parseFloat(asset.locked).toFixed(6)}</Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          )
                        ))}
                      </Grid>
                    )}
                  </Box>
                </Box>
              )}
            </Box>

            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Update Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="New API Key"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    fullWidth
                    margin="normal"
                    placeholder="Enter Binance Testnet API Key"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="New API Secret"
                    value={newApiSecret}
                    onChange={(e) => setNewApiSecret(e.target.value)}
                    fullWidth
                    margin="normal"
                    type="password"
                    placeholder="Enter Binance Testnet API Secret"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <RadioGroup
                      row
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                    >
                      <FormControlLabel value="futures" control={<Radio />} label="Futures" />
                      <FormControlLabel value="spot" control={<Radio />} label="Spot" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={saveConfig}
                    disabled={loading || !newApiKey || !newApiSecret}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save Configuration'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TestnetSettings; 