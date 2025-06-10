
## 🧭 Misi Pengembangan Aplikasi

### **Simulasi Strategi Trading Otomatis Berbasis Web**

### 🎯 **Tujuan Utama**

Membangun sebuah aplikasi berbasis web yang memungkinkan pengguna untuk:

* Mengonfigurasi strategi trading menggunakan indikator teknikal (+DI, –DI, dan ADX)
* Menerima sinyal trading dari TradingView
* Mengambil harga pasar real-time dari Binance
* Melakukan simulasi order otomatis dengan pengaturan **Take Profit**, **Stop Loss**, dan **Leverage**
* Menyimpan dan menampilkan riwayat order untuk analisis strategi

---

## 🧩 Komponen Aplikasi

### 1. 🔧 **Frontend (Antarmuka Pengguna)**

Menyediakan form untuk mengatur strategi dan risiko trading:

#### 📝 Fitur Utama:

* **Form Input Strategi:**

  * Symbol *(default: BTCUSDT)*
  * Timeframe *(default: 5m)*
  * +DI Threshold *(default: 25)*
  * –DI Threshold *(default: 20)*
  * ADX Minimum *(default: 20)*
  * Take Profit % *(default: 2)*
  * Stop Loss % *(default: 1)*
  * Leverage *(default: 10x)*
* **Tombol**:

  * Simpan Konfigurasi
  * (Opsional) Reset/Ubah Konfigurasi
* **Tampilan Konfigurasi Aktif**

---

### 2. 🖥️ **Backend (Layanan Server)**

Menangani logika bisnis, komunikasi dengan API eksternal, dan simulasi order.

#### 🧩 Endpoint & Fungsionalitas:

* `POST /config`
  Menyimpan parameter strategi dari frontend

* `GET /config`
  Menampilkan konfigurasi strategi aktif

* `POST /webhook`
  Menerima sinyal dari TradingView:

  ```json
  {
    "symbol": "BTCUSDT",
    "plusDI": 27.5,
    "minusDI": 15.0,
    "adx": 25.0,
    "timeframe": "5m"
  }
  ```

  #### ✅ Validasi Sinyal:

  * **BUY** jika:

    * `+DI > threshold`
    * `–DI < threshold`
    * `ADX > minimum`
  * **SELL** jika sebaliknya

  #### ⚙️ Jika sinyal valid:

  * Ambil **harga pasar terkini** dari Binance API
  * Hitung **harga entry**, **Take Profit**, dan **Stop Loss**
  * Simulasikan order:

    ```json
    {
      "symbol": "BTCUSDT",
      "action": "BUY",
      "price_entry": "27123.12",
      "tp_price": 27665.58,
      "sl_price": 26851.89,
      "leverage": "10x",
      "timeframe": "5m",
      "timestamp": "2025-05-24T12:34:56Z"
    }
    ```
  * Simpan order ke **log (database/file)**

* `GET /orders`
  Menampilkan seluruh riwayat order simulasi

---

## ⚙️ Default Parameter Strategi

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

---

## 🧪 Kriteria Penilaian

| Aspek Penilaian                                          | Bobot |
| -------------------------------------------------------- | ----- |
| Validasi sinyal berdasarkan indikator DMI/ADX            | 25%   |
| Simulasi order dengan TP/SL dan leverage                 | 20%   |
| Integrasi dengan Binance API                             | 20%   |
| Frontend konfigurasi + komunikasi backend                | 15%   |
| Struktur kode, modularitas, dan dokumentasi              | 15%   |
| (Opsional) Deploy serverless (misalnya: Vercel, Netlify) | 5%    |

---

Jika kamu butuh versi proposal atau dokumentasi teknis dari ini juga, tinggal bilang — saya bisa bantu formatkan.


