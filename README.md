# Bot Trading Simulator

Trading Bot Simulator untuk strategi trading kripto dengan fitur simulasi order berdasarkan sinyal dan backtest.

## Struktur Direktori

```
bot-trading-simulator/
├── frontend/           # Aplikasi React frontend
│   ├── public/         # Asset publik
│   ├── src/            # Kode sumber frontend
│   └── build/          # Build output (dibuat saat build)
│
├── backend/            # Server backend Node.js
│   ├── data/           # Data konfigurasi dan order
│   ├── routes/         # Router API
│   ├── src/            # Kode sumber backend 
│   │   ├── controllers/  # Controller untuk menangani request
│   │   ├── services/     # Service layer untuk logika bisnis
│   │   └── utils/        # Utility functions
│   └── server.js       # Entry point server
│
├── vercel.json         # Konfigurasi deployment Vercel
└── package.json        # Dependencies dan scripts
```

## Fitur

- Simulasi order berdasarkan sinyal trading
- Backtest strategi
- Manajemen konfigurasi trading
- Dashboard monitoring
- Integrasi dengan webhook untuk sinyal trading otomatis

## Menjalankan Aplikasi

### Instalasi

```bash
# Install semua dependencies (root, frontend dan backend)
npm run install:all
```

### Development

```bash
# Jalankan frontend dan backend secara bersamaan
npm start

# Atau jalankan masing-masing:
npm run start:frontend
npm run start:backend
```

### Build untuk Production

```bash
npm run build
```

## Deployment ke Vercel

1. Hubungkan repository dengan Vercel
2. Vercel akan otomatis mendeteksi konfigurasi dari vercel.json
3. Deploy backend sebagai serverless function dan frontend sebagai static site

## API Endpoints

Dokumentasi lengkap API dapat dilihat di [Backend API Documentation](backend/API.md)

## Webhook Testing

Informasi tentang pengujian webhook dapat dilihat di [Webhook Testing Guide](backend/WEBHOOK-TESTING.md) 