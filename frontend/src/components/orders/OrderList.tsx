import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { OrderType } from '../../types';
import { ordersService } from '../../services/api';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchOrders();
    
    // Refresh orders every 30 seconds
    const interval = setInterval(() => {
      fetchOrders(false); // silent refresh (no loading indicator)
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const data = await ordersService.getOrders();
      
      if (Array.isArray(data)) {
        setOrders(data);
        setLastUpdated(new Date());
      } else {
        console.error('Invalid order data received:', data);
        setOrders([]);
        setError('Format data order tidak valid');
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setOrders([]);
      setError(`Gagal mengambil data order: ${err.message || 'Unknown error'}`);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'primary';
      case 'filled':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'closed':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (err) {
      console.warn('Error formatting date:', dateString);
      return '-';
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return '-';
    
    try {
      return price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      });
    } catch (err) {
      console.warn('Error formatting price:', price);
      return '-';
    }
  };

  const formatProfit = (profit: number | undefined | null) => {
    if (profit === undefined || profit === null) return '-';
    
    try {
      const formattedValue = profit.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      return profit >= 0 ? `+${formattedValue}` : formattedValue;
    } catch (error) {
      console.warn('Error formatting profit value:', profit);
      return '-';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Order History
          {lastUpdated && (
            <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<RefreshIcon />} 
          onClick={() => fetchOrders()}
          size="small"
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {!error && orders.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No orders found
        </Typography>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Entry Time</TableCell>
                  <TableCell>Close Time</TableCell>
                  <TableCell>Profit</TableCell>
                  <TableCell>Profit %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(orders) && orders.length > 0 ? (
                  orders
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((order) => (
                      <TableRow key={order.id || `order-${Math.random()}`}>
                        <TableCell>{order.symbol || '-'}</TableCell>
                        <TableCell>
                          {order.side ? (
                            <Chip 
                              label={order.side} 
                              color={order.side.toUpperCase() === 'BUY' ? 'success' : 'error'} 
                              size="small" 
                            />
                          ) : '-'}
                        </TableCell>
                        <TableCell>{order.quantity || '-'}</TableCell>
                        <TableCell>{formatPrice(order.price)}</TableCell>
                        <TableCell>
                          {order.status ? (
                            <Chip 
                              label={order.status} 
                              color={getStatusColor(order.status)} 
                              size="small" 
                              variant="outlined"
                            />
                          ) : '-'}
                        </TableCell>
                        <TableCell>{formatDate(order.entryTime)}</TableCell>
                        <TableCell>{order.closeTime ? formatDate(order.closeTime) : '-'}</TableCell>
                        <TableCell sx={{ 
                          color: order.profit && order.profit > 0 ? 'success.main' : 
                                 order.profit && order.profit < 0 ? 'error.main' : 'text.primary'
                        }}>
                          {formatProfit(order.profit)}
                        </TableCell>
                        <TableCell sx={{ 
                          color: order.profitPercent && order.profitPercent > 0 ? 'success.main' : 
                                 order.profitPercent && order.profitPercent < 0 ? 'error.main' : 'text.primary'
                        }}>
                          {order.profitPercent !== undefined ? `${formatProfit(order.profitPercent)}%` : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {Array.isArray(orders) && orders.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={Array.isArray(orders) ? orders.length : 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </>
      )}
    </Paper>
  );
};

export default OrderList; 