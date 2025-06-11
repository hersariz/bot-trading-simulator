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
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // Fetch current config on component mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      // Gunakan endpoint yang benar
      const response = await api.get('/api/testnet/config');
      
      if (response && response.data) {
        console.log('Config received:', response.data);
        setConfig({
          apiKey: response.data.apiKey || '',
          apiSecret: response.data.secret || '',
          type: response.data.type || 'futures',
          isConfigured: true
        });
        setNewType(response.data.type || 'futures');
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
      
      // Gunakan endpoint yang benar
      const response = await api.post('/api/testnet/config', {
        apiKey: newApiKey,
        apiSecret: newApiSecret,
        type: newType,
      });

      console.log('Server response:', response.data);
      
      if (response.data && !response.data.error) {
        setMessage({ type: 'success', text: 'Testnet configuration saved successfully' });
        fetchConfig();
        setNewApiKey('');
        setNewApiSecret('');
      } else {
        setMessage({ type: 'error', text: response.data?.error || 'Failed to save configuration' });
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
      // Gunakan endpoint yang benar
      const response = await api.get('/api/testnet/connection-test');
      
      if (response.data && !response.data.error) {
        setMessage({
          type: 'success',
          text: 'Successfully connected to Binance Testnet'
        });
      } else {
        setMessage({
          type: 'error',
          text: response.data?.error || 'Failed to connect to Testnet'
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
      // Gunakan endpoint yang benar
      const response = await api.get('/api/testnet/balance');
      
      if (response.data && !response.data.error) {
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
          text: response.data?.error || 'Failed to get account balance'
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
  
  const runSimulation = async () => {
    setRunningSimulation(true);
    setSimulationResults(null);
    setMessage({ type: '', text: '' });
    
    try {
      // Simulasi data untuk pengujian
      const simulationData = {
        strategy: {
          name: 'ADX Crossover',
          timeframe: '1h'
        },
        params: {
          adxPeriod: 14,
          adxThreshold: 25,
          stopLoss: 2,
          takeProfit: 3
        },
        accountConfig: {
          initialBalance: 10000,
          leverage: 5,
          tradingFee: 0.075
        }
      };
      
      // Gunakan endpoint yang benar
      const response = await api.post('/api/testnet/run-simulation', simulationData);
      
      if (response.data && !response.data.error) {
        console.log('Simulation results:', response.data);
        setSimulationResults(response.data);
        setMessage({
          type: 'success',
          text: 'Simulation completed successfully'
        });
      } else {
        setMessage({
          type: 'error',
          text: response.data?.error || 'Failed to run simulation'
        });
      }
    } catch (error: any) {
      console.error('Error running simulation:', error);
      setMessage({
        type: 'error',
        text: `Error running simulation: ${error.response?.data?.error || error.message || 'Unknown error'}`
      });
    } finally {
      setRunningSimulation(false);
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
                    {balanceLoading ? <CircularProgress size={24} /> : 'Check Balance'}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={runSimulation}
                    disabled={runningSimulation}
                  >
                    {runningSimulation ? <CircularProgress size={24} /> : 'Run Test Simulation'}
                  </Button>
                </Box>
              )}
              
              {accountBalance && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>Account Balance</Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        {Object.entries(accountBalance).map(([asset, balance]: [string, any]) => (
                          <Grid item xs={12} sm={6} md={4} key={asset}>
                            <Typography variant="subtitle1">{asset}</Typography>
                            <Typography variant="body1">
                              Free: {balance.free}
                            </Typography>
                            <Typography variant="body1">
                              Used: {balance.used}
                            </Typography>
                            <Typography variant="body1">
                              Total: {balance.total}
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
              )}
              
              {simulationResults && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>Simulation Results</Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle1">Profit/Loss</Typography>
                          <Typography 
                            variant="h4" 
                            color={simulationResults.balance?.profit > 0 ? 'success.main' : 'error.main'}
                          >
                            {simulationResults.balance?.profitPercentage}% 
                            ({simulationResults.balance?.profit} USDT)
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle1">Trades</Typography>
                          <Typography variant="h4">{simulationResults.metrics?.trades || 0}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1" gutterBottom>Orders</Typography>
                          {simulationResults.orders && simulationResults.orders.length > 0 ? (
                            <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {simulationResults.orders.map((order: any, index: number) => (
                                <Box key={index} mb={1} p={1} sx={{ backgroundColor: 'background.paper', borderRadius: 1 }}>
                                  <Typography variant="body2">
                                    {order.side.toUpperCase()} {order.amount} {order.symbol} @ {order.price}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2">No orders executed</Typography>
                          )}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
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
                    helperText="Enter your Binance Testnet API Key"
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
                    helperText="Enter your Binance Testnet API Secret"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="type-label">Type</InputLabel>
                    <Select
                      labelId="type-label"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      label="Type"
                    >
                      <MenuItem value="spot">Spot</MenuItem>
                      <MenuItem value="futures">Futures</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={saveConfig}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Configuration'}
                </Button>
              </Box>
            </Box>
            
            <Box mt={4}>
              <Typography variant="body2" color="text.secondary">
                Note: You need to create a Binance Testnet account to get API keys. Visit the{' '}
                <a href="https://testnet.binance.vision/" target="_blank" rel="noopener noreferrer">
                  Binance Testnet
                </a>{' '}
                website to create an account and generate API keys.
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TestnetSettings; 