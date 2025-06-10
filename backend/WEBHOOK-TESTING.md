# Pengujian Webhook TradingView

Dokumen ini menjelaskan cara menguji fitur webhook untuk simulasi sinyal trading dari TradingView.

## Format Webhook

Format sinyal yang diterima dari TradingView adalah:

```json
{
  "symbol": "BTCUSDT",
  "plusDI": 27.5,
  "minusDI": 15.0,
  "adx": 25.0,
  "timeframe": "5m"
}
```

## Menguji dengan cURL

Anda dapat menggunakan cURL untuk mengirim sinyal trading palsu ke server:

### Sinyal BUY

```bash
curl -X POST http://localhost:5000/api/webhook?token=trd_wh_8f2a7b3d9c4e5f6g7h8i9j0k1l2m3n4o5p \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "plusDI": 27.5,
    "minusDI": 15.0,
    "adx": 25.0,
    "timeframe": "5m"
  }'
```

### Sinyal SELL

```bash
curl -X POST http://localhost:5000/api/webhook?token=trd_wh_8f2a7b3d9c4e5f6g7h8i9j0k1l2m3n4o5p \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "plusDI": 15.0,
    "minusDI": 27.5,
    "adx": 25.0,
    "timeframe": "5m"
  }'
```

### Sinyal Invalid (ADX rendah)

```bash
curl -X POST http://localhost:5000/api/webhook?token=trd_wh_8f2a7b3d9c4e5f6g7h8i9j0k1l2m3n4o5p \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "plusDI": 27.5,
    "minusDI": 15.0,
    "adx": 15.0,
    "timeframe": "5m"
  }'
```

## Menguji dengan Postman

Anda juga dapat menggunakan Postman untuk melakukan pengujian:

1. Buat permintaan POST baru
2. Masukkan URL: `http://localhost:5000/api/webhook?token=trd_wh_8f2a7b3d9c4e5f6g7h8i9j0k1l2m3n4o5p`
3. Pilih tab "Body", lalu pilih "raw" dan "JSON"
4. Masukkan payload sesuai contoh di atas
5. Klik "Send"

## Contoh Respons Sukses

```json
{
  "success": true,
  "message": "Successfully created BUY order",
  "order": {
    "id": "1234567890",
    "symbol": "BTCUSDT",
    "action": "BUY",
    "price_entry": 27123.45,
    "tp_price": 27665.91,
    "sl_price": 26852.21,
    "leverage": 10,
    "timeframe": "5m",
    "timestamp": "2023-05-24T12:34:56Z",
    "signal": {
      "plusDI": 27.5,
      "minusDI": 15.0,
      "adx": 25.0
    }
  }
}
```

## Contoh Respons Error

### Format Payload Salah

```json
{
  "success": false,
  "message": "Missing required fields: plusDI, minusDI"
}
```

### Sinyal Invalid

```json
{
  "success": false,
  "message": "Invalid signal: ADX (15) is below minimum threshold (20)"
}
``` 