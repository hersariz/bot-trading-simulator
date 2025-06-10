import React from 'react';
import {
  Container,
  Typography,
  Box
} from '@mui/material';
import OrderList from '../components/orders/OrderList';

const OrdersPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Order History
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          View the history of all simulated orders executed by the trading bot.
        </Typography>
      </Box>
      
      <OrderList />
    </Container>
  );
};

export default OrdersPage; 