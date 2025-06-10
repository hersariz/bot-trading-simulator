import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Divider,
  CircularProgress,
  IconButton,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { marketService } from '../../services/api';

interface ApiKeyData {
  apiKey: string;
  apiSecret: string;
  isValid: boolean;
  createdAt: string;
}

const BinanceApiSettings: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{success: boolean; message: string} | null>(null);
  const [useDummyData, setUseDummyData] = useState<boolean>(false);

  // Load API key data on component mount
  useEffect(() => {
    fetchApiKeyData();
  }, []);

  // Fetch API key data from backend
  const fetchApiKeyData = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const response = await marketService.getApiKeyStatus();
      
      if (response && response.apiKey) {
        setApiKey(response.apiKey);
        setApiSecret(response.apiSecret || '');
        setUseDummyData(response.useDummyData);
      }
    } catch (error) {
      console.error('Error fetching API key data:', error);
      setStatusMessage({
        success: false,
        message: 'Gagal mengambil data API key'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate new API key
  const generateApiKey = async () => {
    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const response = await marketService.generateApiKey();
      
      if (response && response.apiKey) {
        setApiKey(response.apiKey);
        setApiSecret(response.apiSecret);
        setStatusMessage({
          success: true,
          message: 'API key berhasil dibuat'
        });
        setUseDummyData(response.useDummyData);
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      setStatusMessage({
        success: false,
        message: 'Gagal membuat API key'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete API key
  const deleteApiKey = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      await marketService.deleteApiKey();
      
      setApiKey('');
      setApiSecret('');
      setStatusMessage({
        success: true,
        message: 'API key berhasil dihapus'
      });
      setUseDummyData(true);
    } catch (error) {
      console.error('Error deleting API key:', error);
      setStatusMessage({
        success: false,
        message: 'Gagal menghapus API key'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle use dummy data
  const toggleDummyData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const useDummy = event.target.checked;
    setUseDummyData(useDummy);
    
    try {
      const response = await marketService.toggleDummyData(useDummy);
      
      setStatusMessage({
        success: true,
        message: useDummy 
          ? 'Menggunakan data dummy diaktifkan' 
          : 'Menggunakan data Binance API diaktifkan'
      });
    } catch (error) {
      console.error('Error toggling dummy data:', error);
      setStatusMessage({
        success: false,
        message: 'Gagal mengubah pengaturan data'
      });
      setUseDummyData(!useDummy); // Revert state on error
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Pengaturan API Binance
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Informasi</AlertTitle>
        <Typography variant="body2" paragraph>
          Aplikasi ini menggunakan Binance API untuk mendapatkan data pasar real-time.
          API key dibuat dan dikelola secara otomatis oleh sistem.
        </Typography>
        <Typography variant="body2">
          Anda dapat menggunakan data dummy jika tidak ingin terhubung ke Binance API.
        </Typography>
      </Alert>

      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={useDummyData}
              onChange={toggleDummyData}
              name="useDummyData"
              color="primary"
            />
          }
          label="Gunakan data dummy (tidak terhubung ke Binance)"
        />
        
        <TextField
          fullWidth
          label="API Key"
          value={apiKey}
          margin="normal"
          variant="outlined"
          disabled
          InputProps={{
            readOnly: true,
          }}
        />
        
        <TextField
          fullWidth
          label="API Secret"
          type={showSecret ? 'text' : 'password'}
          value={apiSecret}
          margin="normal"
          variant="outlined"
          disabled
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowSecret(!showSecret)}
                  edge="end"
                >
                  {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={generateApiKey}
            disabled={isGenerating}
          >
            {isGenerating ? <CircularProgress size={24} /> : 'Generate API Key Baru'}
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            onClick={deleteApiKey}
            disabled={isLoading || !apiKey}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Hapus API Key'}
          </Button>
        </Box>
      </Box>

      {statusMessage && (
        <Alert 
          severity={statusMessage.success ? 'success' : 'error'} 
          sx={{ mt: 3 }}
        >
          {statusMessage.message}
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Informasi API Key
      </Typography>

      <Box component="ul" sx={{ pl: 2 }}>
        <li>
          <Typography variant="body2">
            API key dibuat dan dikelola oleh sistem secara otomatis
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            API key hanya memiliki izin READ-ONLY untuk keamanan
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Data pasar real-time diambil dari Binance API
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Anda dapat menggunakan data dummy jika tidak ingin terhubung ke Binance API
          </Typography>
        </li>
      </Box>
    </Paper>
  );
};

export default BinanceApiSettings; 