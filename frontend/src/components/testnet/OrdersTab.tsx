import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Button, 
  TextField, 
  MenuItem, 
  Stack,
  Box,
  Paper, 
  Typography, 
  CircularProgress, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import api from '../../services/api';

// Error handling helper function
const getBinanceErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  if (error.response?.data?.error) {
    const errorMsg = error.response.data.error;
    
    // Check for specific Binance error patterns
    if (errorMsg.includes('Failed to get open orders (404)')) {
      return 'Tidak dapat mengambil data order. Endpoint API tidak ditemukan. Silakan periksa konfigurasi Testnet.';
    }
    
    if (errorMsg.includes('API-key format invalid')) {
      return 'Format API key tidak valid. Silakan periksa konfigurasi Testnet.';
    }
    
    if (errorMsg.includes('Signature for this request is not valid')) {
      return 'Signature tidak valid. Silakan periksa API Secret pada konfigurasi Testnet.';
    }
    
    if (errorMsg.includes('Invalid symbol')) {
      return `Symbol '${error.config?.params?.symbol || 'BTCUSDT'}' tidak valid untuk akun Testnet ini.`;
    }
    
    return errorMsg;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Terjadi kesalahan saat berkomunikasi dengan API';
};

const OrdersTab: React.FC = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [side, setSide] = useState('BUY');
  const [quantity, setQuantity] = useState('0.001');
  const [orders, setOrders] = useState<any[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info' | ''; text: string}>({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      console.log(`Fetching orders for symbol: ${symbol || 'All symbols'}`);
      
      const response = await api.post('/api/testnet/run-simulation', {
        action: 'check_orders',
        symbol: symbol || undefined // Only include if not empty
      });
      
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        setOrders(response.data.data.orders || []);
        if ((response.data.data.orders || []).length === 0) {
          setMessage({ type: 'info', text: 'Tidak ada order terbuka saat ini' });
        }
      } else {
        setMessage({ type: 'error', text: getBinanceErrorMessage(response.data) });
        console.error('Error from API:', response.data.error);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      
      setMessage({ 
        type: 'error', 
        text: getBinanceErrorMessage(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setOrderLoading(true);
      setMessage({ type: '', text: 'Menempatkan order...' });
      
      console.log(`Placing ${side} order for ${quantity} ${symbol}`);
      
      const response = await api.post('/api/testnet/run-simulation', {
        action: 'market_order',
        symbol,
        side,
        quantity: parseFloat(quantity)
      });
      
      console.log('Order API Response:', response.data);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Order berhasil ditempatkan!' });
        fetchOrders(); // Refresh daftar order
      } else {
        setMessage({ type: 'error', text: getBinanceErrorMessage(response.data) });
        console.error('Error from API:', response.data.error);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      
      setMessage({ 
        type: 'error', 
        text: getBinanceErrorMessage(error)
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Place Market Order</Typography>
        <Stack spacing={2} direction="row" sx={{ mb: 2, mt: 2 }}>
          <TextField
            label="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Side"
            value={side}
            onChange={(e) => setSide(e.target.value)}
            fullWidth
          >
            <MenuItem value="BUY">BUY</MenuItem>
            <MenuItem value="SELL">SELL</MenuItem>
          </TextField>
          <TextField
            label="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            fullWidth
            type="number"
            inputProps={{ step: "0.0001" }}
          />
          <Button 
            variant="contained" 
            color="primary"
            onClick={handlePlaceOrder}
            disabled={orderLoading}
            sx={{ minWidth: '120px' }}
          >
            {orderLoading ? <CircularProgress size={24} /> : 'Place Order'}
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Open Orders</Typography>
        
        <Button 
          variant="outlined" 
          onClick={fetchOrders} 
          sx={{ mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Refresh Orders'}
        </Button>
        
        {message.text && (
          <Alert severity={message.type || 'info'} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}
        
        {orders.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell>{order.symbol}</TableCell>
                    <TableCell>{order.side}</TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell>{order.origQty}</TableCell>
                    <TableCell>{order.price}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>{formatTime(order.time)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          !loading && <Typography>Tidak ada order terbuka</Typography>
        )}
      </Paper>
    </div>
  );
};

export default OrdersTab; 