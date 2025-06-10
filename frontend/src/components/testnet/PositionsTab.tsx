import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Paper, 
  Typography, 
  CircularProgress, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Box,
  Chip
} from '@mui/material';
import api from '../../services/api';

const PositionsTab: React.FC = () => {
  const [positions, setPositions] = useState<any[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info' | ''; text: string}>({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await api.post('/api/testnet/run-simulation', {
        action: 'check_positions'
      });
      
      if (response.data.success) {
        // Filter hanya posisi yang tidak nol
        const activePositions = (response.data.data.positions || [])
          .filter((pos: any) => parseFloat(pos.positionAmt) !== 0);
          
        setPositions(activePositions);
        if (activePositions.length === 0) {
          setMessage({ type: 'info', text: 'Tidak ada posisi aktif saat ini' });
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: response.data.error || 'Gagal mengambil data posisi'
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || 'Terjadi kesalahan saat mengambil data posisi'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: string | number, decimals: number = 4) => {
    const num = parseFloat(String(value));
    return isNaN(num) ? '0' : num.toFixed(decimals);
  };

  const isPnlPositive = (pnl: string) => {
    return parseFloat(pnl) >= 0;
  };

  return (
    <div>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Futures Positions</Typography>
        
        <Button 
          variant="outlined" 
          onClick={fetchPositions} 
          sx={{ mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Refresh Positions'}
        </Button>
        
        {message.text && (
          <Alert severity={message.type || 'info'} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}
        
        {positions.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Entry Price</TableCell>
                  <TableCell>Mark Price</TableCell>
                  <TableCell>PnL</TableCell>
                  <TableCell>Leverage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map((pos) => (
                  <TableRow key={pos.symbol}>
                    <TableCell>{pos.symbol}</TableCell>
                    <TableCell>
                      <Chip 
                        label={parseFloat(pos.positionAmt) > 0 ? 'LONG' : 'SHORT'}
                        color={parseFloat(pos.positionAmt) > 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatNumber(pos.positionAmt)}</TableCell>
                    <TableCell>{formatNumber(pos.entryPrice)}</TableCell>
                    <TableCell>{formatNumber(pos.markPrice)}</TableCell>
                    <TableCell>
                      <Box component="span" sx={{ 
                        color: isPnlPositive(pos.unrealizedProfit) ? 'success.main' : 'error.main',
                        fontWeight: 'bold'
                      }}>
                        {isPnlPositive(pos.unrealizedProfit) ? '+' : ''}
                        {formatNumber(pos.unrealizedProfit)}
                      </Box>
                    </TableCell>
                    <TableCell>{pos.leverage}x</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          !loading && <Typography>Tidak ada posisi aktif</Typography>
        )}
      </Paper>
    </div>
  );
};

export default PositionsTab; 