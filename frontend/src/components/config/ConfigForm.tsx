import React, { useState, useEffect, ChangeEvent } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControlLabel, 
  Switch, 
  Typography, 
  Paper,
  Grid,
  Slider,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert
} from '@mui/material';
import { ConfigType } from '../../types';
import { configService, marketService } from '../../services/api';

const DEFAULT_CONFIG: ConfigType = {
  symbol: 'BTCUSDT',
  timeframe: '5m',
  quantity: 0.001,
  leverage: 10,
  stopLossPercent: 1,
  takeProfitPercent: 2,
  trailingStop: false,
  trailingStopPercent: 1,
  plusDiThreshold: 25,
  minusDiThreshold: 20,
  adxMinimum: 20,
  marketDataSource: 'binance'
};

const ConfigForm: React.FC = () => {
  const [config, setConfig] = useState<ConfigType>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [testingSource, setTestingSource] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; price?: number } | null>(null);
  const [createOrderNow, setCreateOrderNow] = useState<boolean>(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const data = await configService.getConfig();
        if (data) {
          const safeData: ConfigType = {
            symbol: data.symbol || DEFAULT_CONFIG.symbol,
            timeframe: data.timeframe || DEFAULT_CONFIG.timeframe,
            quantity: data.quantity ?? DEFAULT_CONFIG.quantity,
            leverage: data.leverage ?? DEFAULT_CONFIG.leverage,
            stopLossPercent: data.stopLossPercent ?? DEFAULT_CONFIG.stopLossPercent,
            takeProfitPercent: data.takeProfitPercent ?? DEFAULT_CONFIG.takeProfitPercent,
            trailingStop: typeof data.trailingStop === 'boolean' ? data.trailingStop : DEFAULT_CONFIG.trailingStop,
            trailingStopPercent: data.trailingStopPercent ?? DEFAULT_CONFIG.trailingStopPercent,
            plusDiThreshold: data.plusDiThreshold ?? DEFAULT_CONFIG.plusDiThreshold,
            minusDiThreshold: data.minusDiThreshold ?? DEFAULT_CONFIG.minusDiThreshold,
            adxMinimum: data.adxMinimum ?? DEFAULT_CONFIG.adxMinimum,
            marketDataSource: data.marketDataSource || DEFAULT_CONFIG.marketDataSource
          };
          setConfig(safeData);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch config:', err);
        setError('Failed to load configuration. Using default values.');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSliderChange = (name: string) => (_event: Event, newValue: number | number[]) => {
    setConfig(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    setOrderResult(null);

    try {
      const response = await configService.updateConfig(config, createOrderNow);
      setSuccess(true);
      
      // Check if order was created
      if (createOrderNow && response.orderCreated) {
        setOrderResult(response);
        setOrderDialogOpen(true);
      }
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update config:', err);
      setError('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOrderDialog = () => {
    setOrderDialogOpen(false);
  };

  const getNumericValue = (value: any) => {
    return value === undefined || value === null ? '' : String(value);
  };

  const handleTestConnection = async () => {
    setTestingSource(true);
    setTestResult(null);
    
    try {
      const source = config.marketDataSource || 'binance';
      const response = await marketService.testConnection(source);
      setTestResult(response);
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult({ 
        success: false, 
        message: 'Error connecting to the market data source' 
      });
    } finally {
      setTestingSource(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Trading Strategy Configuration
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Symbol"
              name="symbol"
              value={config.symbol || ''}
              onChange={handleInputChange}
              margin="normal"
              helperText="Trading pair (e.g. BTCUSDT)"
            />
          </Grid>
          
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Timeframe"
              name="timeframe"
              value={config.timeframe || ''}
              onChange={handleInputChange}
              margin="normal"
              helperText="Timeframe (e.g. 5m, 1h, 4h)"
            />
          </Grid>
          
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={getNumericValue(config.quantity)}
              onChange={handleInputChange}
              margin="normal"
              inputProps={{ step: 0.001 }}
              helperText="Trading quantity"
            />
          </Grid>
          
          <Grid xs={12} md={6}>
            <Typography gutterBottom>Leverage: {config.leverage || 0}x</Typography>
            <Slider
              value={config.leverage ?? DEFAULT_CONFIG.leverage}
              onChange={handleSliderChange('leverage')}
              aria-labelledby="leverage-slider"
              valueLabelDisplay="auto"
              step={1}
              marks
              min={1}
              max={20}
            />
          </Grid>
          
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Stop Loss"
              name="stopLossPercent"
              type="number"
              value={getNumericValue(config.stopLossPercent)}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{ step: 0.1 }}
              helperText="Stop loss percentage"
            />
          </Grid>
          
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Take Profit"
              name="takeProfitPercent"
              type="number"
              value={getNumericValue(config.takeProfitPercent)}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{ step: 0.1 }}
              helperText="Take profit percentage"
            />
          </Grid>

          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="+DI Threshold"
              name="plusDiThreshold"
              type="number"
              value={getNumericValue(config.plusDiThreshold)}
              onChange={handleInputChange}
              margin="normal"
              inputProps={{ step: 1 }}
              helperText="+DI value above which buy signals are considered"
            />
          </Grid>

          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="-DI Threshold"
              name="minusDiThreshold"
              type="number"
              value={getNumericValue(config.minusDiThreshold)}
              onChange={handleInputChange}
              margin="normal"
              inputProps={{ step: 1 }}
              helperText="-DI value below which buy signals are considered"
            />
          </Grid>

          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="ADX Minimum"
              name="adxMinimum"
              type="number"
              value={getNumericValue(config.adxMinimum)}
              onChange={handleInputChange}
              margin="normal"
              inputProps={{ step: 1 }}
              helperText="Minimum ADX value for valid signals"
            />
          </Grid>
          
          <Grid xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(config.trailingStop)}
                  onChange={handleInputChange}
                  name="trailingStop"
                  color="primary"
                />
              }
              label="Enable Trailing Stop"
            />
          </Grid>
          
          {config.trailingStop && (
            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                label="Trailing Stop Percent"
                name="trailingStopPercent"
                type="number"
                value={getNumericValue(config.trailingStopPercent)}
                onChange={handleInputChange}
                margin="normal"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{ step: 0.1 }}
                helperText="Trailing stop percentage"
              />
            </Grid>
          )}
          
          <Grid xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="market-data-source-label">Market Data Source</InputLabel>
              <Select
                labelId="market-data-source-label"
                id="market-data-source"
                name="marketDataSource"
                value={config.marketDataSource || 'binance'}
                label="Market Data Source"
                onChange={handleSelectChange}
              >
                <MenuItem value="binance">Binance</MenuItem>
                <MenuItem value="coingecko">CoinGecko</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={handleTestConnection}
              disabled={testingSource}
              sx={{ mt: 1 }}
            >
              {testingSource ? 'Testing...' : 'Test Connection'}
            </Button>
            
            {testResult && (
              <Box sx={{ mt: 1 }}>
                <Typography color={testResult.success ? 'success.main' : 'error.main'}>
                  {testResult.message}
                </Typography>
                {testResult.success && testResult.price && (
                  <Typography variant="body2">
                    BTC Price: ${testResult.price.toFixed(2)}
                  </Typography>
                )}
              </Box>
            )}
          </Grid>
          
          <Grid xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={createOrderNow}
                  onChange={(e) => setCreateOrderNow(e.target.checked)}
                  name="createOrderNow"
                  color="primary"
                />
              }
              label="Create order immediately after saving"
            />
            <Typography variant="caption" color="text.secondary">
              This will create an order based on current market conditions using the new configuration
            </Typography>
          </Grid>
          
          <Grid xs={12}>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : createOrderNow ? 'Save & Create Order' : 'Save Configuration'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => setConfig(DEFAULT_CONFIG)}
              >
                Reset to Defaults
              </Button>
            </Box>
            
            {success && !orderResult && (
              <Box sx={{ mt: 2, color: 'success.main' }}>
                Configuration saved successfully!
              </Box>
            )}
            
            {error && (
              <Box sx={{ mt: 2, color: 'error.main' }}>
                {error}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
      
      {/* Order Result Dialog */}
      <Dialog
        open={orderDialogOpen}
        onClose={handleCloseOrderDialog}
        aria-labelledby="order-dialog-title"
        aria-describedby="order-dialog-description"
      >
        <DialogTitle id="order-dialog-title">
          Order Creation Result
        </DialogTitle>
        <DialogContent>
          {orderResult && (
            <>
              {orderResult.success ? (
                <>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {orderResult.message}
                  </Alert>
                  
                  {orderResult.order && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1">Order Details:</Typography>
                      <Typography variant="body2">Symbol: {orderResult.order.symbol}</Typography>
                      <Typography variant="body2">Action: {orderResult.order.action}</Typography>
                      <Typography variant="body2">Entry Price: {orderResult.order.price_entry}</Typography>
                      <Typography variant="body2">Take Profit: {orderResult.order.tp_price}</Typography>
                      <Typography variant="body2">Stop Loss: {orderResult.order.sl_price}</Typography>
                      <Typography variant="body2">Status: {orderResult.order.status}</Typography>
                      
                      {orderResult.order.testnet_order_id && (
                        <Typography variant="body2">
                          Testnet Order ID: {orderResult.order.testnet_order_id}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {orderResult.signal && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1">Signal Values:</Typography>
                      <Typography variant="body2">ADX: {orderResult.signal.adx.toFixed(2)}</Typography>
                      <Typography variant="body2">+DI: {orderResult.signal.plusDI.toFixed(2)}</Typography>
                      <Typography variant="body2">-DI: {orderResult.signal.minusDI.toFixed(2)}</Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Alert severity="warning">
                  Configuration saved, but could not create order: {orderResult.message}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDialog} color="primary" autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ConfigForm; 