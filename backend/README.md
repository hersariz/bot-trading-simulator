# Bot Trading Simulator - Backend

Backend service untuk aplikasi Bot Trading Simulator yang ditulis dengan Node.js dan Express.

## Fitur Utama

- Konfigurasi strategi trading berbasis indikator DMI/ADX
- Webhook endpoint untuk menerima sinyal dari TradingView
- Integrasi dengan Binance API untuk data pasar real-time
- Simulasi order dengan take profit dan stop loss
- Penyimpanan dan pengelolaan riwayat order

## Optimasi Performa

Beberapa optimasi performa telah diterapkan:
- Implementasi caching untuk konfigurasi
- Reduksi logging di environment produksi
- Validasi signal yang lebih efisien
- Handling error yang lebih baik

## Pengembangan

```bash
# Install dependencies
npm install

# Jalankan server dalam mode development
npm run dev

# Jalankan server dalam mode produksi
npm start
```

## Testing Webhook

Untuk menguji webhook, gunakan script `send-test-webhook.js`:

```bash
# Kirim sinyal BUY
node send-test-webhook.js

# Kirim sinyal SELL
node send-test-webhook.js --sell
```

## API Endpoints

Aplikasi ini menyediakan beberapa endpoint API:

- `GET /api/config` - Mendapatkan konfigurasi strategi saat ini
- `POST /api/config` - Memperbarui konfigurasi strategi
- `POST /api/webhook` - Menerima sinyal trading dari TradingView
- `GET /api/orders` - Mendapatkan daftar order simulasi
- `GET /api/orders/:id` - Mendapatkan detail order simulasi
- `GET /api/market/price/:symbol` - Mendapatkan harga pasar terkini

## Environment Variables

Buat file `.env` dengan variabel berikut:

```
# API Configuration
PORT=5000
NODE_ENV=development

# Webhook Configuration
WEBHOOK_TOKEN=your_webhook_token_here

# Binance API (optional for testnet)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
BINANCE_API_URL=https://testnet.binance.vision
``` 