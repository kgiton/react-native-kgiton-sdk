# 📚 Dokumentasi @kgiton/react-native-sdk

Selamat datang di dokumentasi @kgiton/react-native-sdk. Panduan ini akan membantu Anda mengintegrasikan SDK ke dalam aplikasi React Native Anda.

---

## 📖 Daftar Isi

| # | Dokumen | Deskripsi |
|---|---------|-----------|
| 1 | [Getting Started](01_GETTING_STARTED.md) | Instalasi, konfigurasi, dan setup awal |
| 2 | [Authentication](02_AUTHENTICATION.md) | Login, register, session, password reset |
| 3 | [License & Token](03_LICENSE_TOKEN.md) | Validasi license, saldo token, penggunaan token |
| 4 | [Top-up & Payment](04_TOPUP_PAYMENT.md) | Top-up token, metode pembayaran, status transaksi |
| 5 | [BLE Integration](05_BLE_INTEGRATION.md) | Koneksi ke timbangan, streaming berat, buzzer |
| 6 | [API Reference](06_API_REFERENCE.md) | Referensi lengkap semua API |
| 7 | [Troubleshooting](07_TROUBLESHOOTING.md) | Masalah umum dan solusinya |

---

## 🚀 Quick Links

### Untuk Pemula
1. Mulai dari [Getting Started](01_GETTING_STARTED.md)
2. Pelajari [Authentication](02_AUTHENTICATION.md)
3. Pahami [License & Token](03_LICENSE_TOKEN.md)

### Untuk Integrasi Pembayaran
1. Baca [Top-up & Payment](04_TOPUP_PAYMENT.md)
2. Lihat contoh kode lengkap

### Untuk Integrasi Timbangan
1. Baca [BLE Integration](05_BLE_INTEGRATION.md)
2. Pastikan izin Bluetooth sudah dikonfigurasi

---

## 🏗️ Arsitektur SDK

```
@kgiton/react-native-sdk
├── API Integration
│   ├── KGiTONApiClient        (Low-level HTTP client)
│   ├── KGiTONApiService       (Main service facade)
│   │   ├── auth               (AuthService)
│   │   ├── user               (UserService)
│   │   ├── license            (LicenseService)
│   │   ├── topup              (TopupService)
│   │   └── licenseTransaction (LicenseTransactionService)
│   └── Exceptions             (Type-safe error handling)
│
├── BLE Integration
│   └── KGiTONBleService       (Scale connection & control)
│
└── Utils
    ├── StorageService         (Token persistence)
    └── DebugLogger            (Debug logging)
```

---

## 📱 Platform Support

| Platform | Minimum Version | BLE Support | Status |
|----------|-----------------|-------------|--------|
| Android | 5.0 (API 21) | ✅ | ✅ Supported |
| iOS | 12.0 | ✅ | ✅ Supported |

---

## 🔗 Resources

- [GitHub Repository](https://github.com/kgiton/react-native-kgiton-sdk)
- [API Documentation](https://api.kgiton.com/docs)
- [Support](mailto:support@kgiton.com)

---

<p align="center">
  <strong>PT KGiTON</strong> © 2026
</p>
