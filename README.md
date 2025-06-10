# Bot Trading Simulator

Aplikasi berbasis web untuk simulasi strategi trading otomatis dengan indikator teknikal (+DI, -DI, dan ADX). Simulator ini memungkinkan pengguna untuk mengkonfigurasi strategi trading dan mengujinya menggunakan data pasar real-time dari Binance.

## ✨ Fitur Utama

* 📊 Konfigurasi strategi trading dengan indikator teknikal
* 📈 Menerima sinyal trading dari TradingView melalui webhook
* 💹 Mengambil harga pasar real-time dari Binance API
* 🤖 Simulasi order otomatis dengan pengaturan Take Profit, Stop Loss, dan Leverage
* 📝 Menyimpan dan menampilkan riwayat order untuk analisis strategi
* 🔄 Simulasi perubahan harga dan otomatisasi update status order
* 💰 Perhitungan profit dan profit percentage berdasarkan pergerakan harga
* 🔁 Sinkronisasi dengan Binance Testnet untuk order dan status terupdate secara realtime
* 🚀 **Fitur baru**: Membuat order langsung dari halaman konfigurasi dengan sekali klik

## 📁 Struktur Proyek

- `/frontend` - Aplikasi React dengan TypeScript untuk antarmuka pengguna
- `/backend` - Server Express/Node.js untuk logika bisnis dan API

## ⚙️ Parameter Default Strategi

| Parameter       | Nilai Default |
| --------------- | ------------- |
| Symbol          | BTCUSDT       |
| Timeframe       | 5m            |
| +DI Threshold   | 25            |
| –DI Threshold   | 20            |
| ADX Minimum     | 20            |
| Take Profit (%) | 2             |
| Stop Loss (%)   | 1             |
| Leverage        | 10x           |

## 🚀 Cara Menjalankan Aplikasi

### Backend

```bash
cd backend
npm install
npm start
```

Untuk development mode dengan hot-reload:
```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## 🤖 Komponen Otomatis

### Market Simulator

Market Simulator secara otomatis dijalankan ketika server dimulai. Simulator ini akan:

1. Memperbarui profit untuk semua order yang masih terbuka (status = OPEN)
2. Men-trigger Take Profit atau Stop Loss ketika harga mencapai level tersebut
3. Secara otomatis menambahkan closed_time, profit, dan profit_percent ke order

Anda dapat menjalankan simulator secara terpisah dengan beberapa cara:

```bash
# Menjalankan simulator secara terpisah
npm run simulator:start

# Menjalankan update order secara terus-menerus
npm run check-orders

# Menjalankan update order sekali saja
npm run check-orders:once

# Menjalankan dengan interval kustom (dalam ms)
node check-orders.js --interval=30000
```

### Testnet Sync Service

Testnet Sync Service secara otomatis dijalankan ketika server dimulai. Service ini akan:

1. Mengambil status order terbaru dari Binance Testnet
2. Memperbarui status order lokal berdasarkan status di testnet
3. Menghitung profit berdasarkan posisi di testnet
4. Secara otomatis memperbarui status order, closeTime, dan profit

Anda dapat menjalankan sinkronisasi testnet secara terpisah:

```bash
# Menjalankan sinkronisasi testnet secara terus-menerus
npm run sync-testnet

# Menjalankan sinkronisasi testnet sekali saja
npm run sync-testnet:once

# Menjalankan dengan interval kustom (dalam ms)
node sync-testnet.js --interval=60000
```

## 🔌 API Endpoints

### Config API

- `GET /api/config` - Mendapatkan konfigurasi strategi saat ini
- `POST /api/config` - Menyimpan konfigurasi strategi baru
- `POST /api/config?createOrderNow=true` - Menyimpan konfigurasi dan membuat order langsung

### Webhook API

- `POST /api/webhook` - Menerima sinyal dari TradingView
- `GET /api/webhook/info` - Mendapatkan URL dan token webhook

### Market API

- `GET /api/market/price/:symbol` - Mendapatkan harga pasar saat ini
- `GET /api/market/data` - Mendapatkan data pasar lengkap
- `GET /api/market/historical` - Mendapatkan data harga historis
- `GET /api/market/api-key` - Memeriksa status API key Binance
- `GET /api/market/test-source` - Menguji koneksi ke sumber data pasar

### Order API

- `GET /api/orders` - Mendapatkan semua order
- `GET /api/orders?updateProfits=true` - Mendapatkan semua order dengan profit terupdate
- `GET /api/orders/:orderId` - Mendapatkan order tertentu
- `POST /api/orders/:orderId/calculate-profit` - Menghitung dan memperbarui profit order
- `PUT /api/orders/:orderId/status` - Memperbarui status order
- `DELETE /api/orders/:orderId` - Menghapus order

### Market Simulator API

- `POST /api/market/simulator/start` - Memulai simulator pasar
- `POST /api/market/simulator/stop` - Menghentikan simulator pasar
- `GET /api/market/simulator/status` - Memeriksa status simulator
- `POST /api/market/simulator/update` - Memaksa update untuk semua order

### Testnet Sync API

- `POST /api/testnet-sync/start` - Memulai sinkronisasi testnet
- `POST /api/testnet-sync/stop` - Menghentikan sinkronisasi testnet
- `GET /api/testnet-sync/status` - Memeriksa status sinkronisasi
- `POST /api/testnet-sync/sync` - Memaksa sinkronisasi untuk semua order
- `POST /api/testnet-sync/orders/:orderId` - Memaksa sinkronisasi untuk order tertentu

## 📝 Menggunakan Webhook TradingView

Aplikasi ini dapat menerima sinyal trading dari TradingView melalui webhook. Berikut cara menggunakannya:

### Format Webhook

Gunakan format JSON berikut dalam alert TradingView Anda:

```json
{
  "symbol": "BTCUSDT",
  "plusDI": 27.5,
  "minusDI": 15.0,
  "adx": 25.0,
  "timeframe": "5m"
}
```

### URL Webhook

Atur webhook URL pada alert TradingView ke:

```
http://[your-server-url]/api/webhook?token=trd_wh_8f2a7b3d9c4e5f6g7h8i9j0k1l2m3n4o5p
```

## 🚀 Deployment

### Persiapan untuk GitHub

1. Buat file `.gitignore` di root proyek:

```
# Dependensi
node_modules/
.pnp/
.pnp.js

# Build
/build
/dist
/frontend/build
/frontend/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production

# Data files (untuk development)
/backend/data/*.json
!/backend/data/config.json

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs
*.log

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db
```

2. Initialize Git repository dan push ke GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/bot-trading-simulator.git
git push -u origin main
```

### Deployment ke Vercel

1. Buat akun di [Vercel](https://vercel.com) jika belum memiliki
2. Install Vercel CLI:

```bash
npm install -g vercel
```

3. Login ke Vercel:

```bash
vercel login
```

4. Deploy proyek:

```bash
vercel
```

5. Untuk deployment production:

```bash
vercel --prod
```

6. Konfigurasi environment variables di dashboard Vercel:
   - BINANCE_API_KEY
   - BINANCE_API_SECRET
   - WEBHOOK_TOKEN

## 📋 Fitur Terpenuhi dari Misi

- ✅ Validasi sinyal berdasarkan indikator DMI/ADX
- ✅ Simulasi order dengan TP/SL dan leverage
- ✅ Integrasi dengan Binance API
- ✅ Frontend konfigurasi + komunikasi backend
- ✅ Struktur kode, modularitas, dan dokumentasi
- ✅ Fitur tambahan: Sinkronisasi dengan Binance Testnet
- ✅ Fitur tambahan: Simulator pasar untuk update profit dan status order
- ✅ Fitur tambahan: Membuat order langsung dari halaman konfigurasi
- ⬜ Deploy serverless (siap untuk di-deploy ke Vercel)

## 📝 Catatan

Untuk simulasi order di lingkungan lokal, data disimpan dalam file JSON di folder `backend/data/orders`. Untuk deployment production, sebaiknya gunakan database yang sebenarnya seperti MongoDB atau PostgreSQL. 