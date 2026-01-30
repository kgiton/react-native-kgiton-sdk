<p align="center">
  <img src="logo/kgiton-logo.png" alt="KGiTON Logo" width="300"/>
</p>

<h1 align="center">@kgiton/react-native-sdk</h1>

<p align="center">
  <strong>Official React Native SDK for KGiTON Scale Devices & API Integration</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#support">Support</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-blue" alt="Platform"/>
  <img src="https://img.shields.io/badge/React%20Native-%3E%3D0.64.0-blue" alt="React Native"/>
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License"/>
</p>

---

## 📋 Overview

@kgiton/react-native-sdk menyediakan integrasi lengkap untuk:

1. **BLE Scale Integration** - Koneksi ke timbangan KGiTON via Bluetooth Low Energy
2. **REST API Client** - Komunikasi dengan backend KGiTON untuk autentikasi, license, dan token

### Sistem Token

KGiTON menggunakan sistem token untuk penggunaan timbangan:
- **1 Token = 1 Sesi Penimbangan**
- Token dapat dibeli (top-up) melalui berbagai metode pembayaran
- Setiap license key memiliki saldo token tersendiri
- **Bonus tokens** diberikan berdasarkan jumlah pembelian

### 🎁 Bonus Token Tiers

| Token Range | Bonus |
|-------------|-------|
| 100 - 499 | 0 |
| 500 - 999 | +25 |
| 1,000 - 4,999 | +100 |
| 5,000 - 9,999 | +750 |
| 10,000+ | +2,000 |

---

## ✨ Features

### 🔵 BLE Scale Integration
| Feature | Description |
|---------|-------------|
| Device Discovery | Scan perangkat KGiTON dengan filter RSSI |
| Real-time Weight | Streaming data berat @ 10Hz |
| License Auth | Autentikasi perangkat dengan license key |
| Buzzer Control | Kontrol buzzer (BEEP, BUZZ, LONG, OFF) |
| Tare Control | Reset timbangan ke nol |
| Auto-reconnect | Reconnect otomatis saat koneksi terputus |

### 🌐 API Integration
| Feature | Description |
|---------|-------------|
| Authentication | Register, login, logout, reset password |
| User Management | Profile, API key management |
| License Management | Validasi license, assign license |
| Token System | Cek saldo, gunakan token, top-up |
| Payment Gateway | Multiple payment methods (VA, QRIS, etc) |

---

## 📦 Installation

### 1. Install Package

> ⚠️ **Note:** SDK ini tidak dipublikasikan ke npm registry. Instalasi dilakukan langsung dari repository GitHub.

```bash
# npm - Install dari GitHub
npm install git+https://github.com/kgiton/react-native-kgiton-sdk.git react-native-ble-plx @react-native-async-storage/async-storage

# yarn - Install dari GitHub
yarn add git+https://github.com/kgiton/react-native-kgiton-sdk.git react-native-ble-plx @react-native-async-storage/async-storage
```

**Atau tambahkan di package.json:**
```json
{
  "dependencies": {
    "@kgiton/react-native-sdk": "git+https://github.com/kgiton/react-native-kgiton-sdk.git"
  }
}
```

### 2. iOS Configuration

**Install Pods:**
```bash
cd ios && pod install
```

**`ios/[YourApp]/Info.plist`:**
```xml
<dict>
    <!-- Bluetooth Permissions -->
    <key>NSBluetoothAlwaysUsageDescription</key>
    <string>Aplikasi memerlukan Bluetooth untuk terhubung ke timbangan KGiTON</string>
    
    <key>NSBluetoothPeripheralUsageDescription</key>
    <string>Aplikasi memerlukan Bluetooth untuk terhubung ke timbangan KGiTON</string>
    
    <!-- Location (required for BLE scanning) -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Lokasi diperlukan untuk menemukan perangkat Bluetooth terdekat</string>
</dict>
```

**`ios/Podfile`:**
```ruby
platform :ios, '12.0'
```

### 3. Android Configuration

**`android/app/src/main/AndroidManifest.xml`:**
```xml
<manifest>
    <!-- Bluetooth Permissions -->
    <uses-permission android:name="android.permission.BLUETOOTH"/>
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" 
        android:usesPermissionFlags="neverForLocation"/>
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
    
    <!-- Location (required for BLE scanning on Android 10-11) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    
    <!-- Internet -->
    <uses-permission android:name="android.permission.INTERNET"/>
</manifest>
```

**`android/app/build.gradle`:**
```groovy
android {
    defaultConfig {
        minSdkVersion 21  // Android 5.0+
    }
}
```

---

## 🚀 Quick Start

### Import SDK

```typescript
import { 
  KGiTONApiService, 
  KGiTONBleService,
  ConnectionState,
  WeightData,
  ScaleDevice,
} from '@kgiton/react-native-sdk';
```

### 1. Authentication

```typescript
// Initialize API service
const api = new KGiTONApiService({
  baseUrl: 'https://api.kgiton.com',
  debug: true, // Enable debug logging
});

// Register new user
const authData = await api.auth.register({
  email: 'user@example.com',
  password: 'securePassword123',
  confirmPassword: 'securePassword123',
  licenseKey: 'KGITON-2026-XXXXX-00001',
});

// Login
const loginData = await api.auth.login({
  email: 'user@example.com',
  password: 'securePassword123',
});

console.log('Token:', loginData.accessToken);
console.log('User:', loginData.user);
```

### 2. User & Token Operations

```typescript
// Get user profile
const profile = await api.user.getProfile();
console.log('Email:', profile.email);

// Get assigned license info
const license = await api.user.getAssignedLicense();
console.log('License:', license.key);
console.log('Token Balance:', license.tokenBalance);

// Use a token for weighing session
const result = await api.user.useToken(license.key);
console.log('Remaining tokens:', result.remainingBalance);

// Get token usage statistics
const stats = await api.user.getTokenUsageStats();
console.log('Weekly Usage:', stats.weeklyUsage);
console.log('Avg Daily:', stats.avgDailyUsage.toFixed(1));
console.log('Est Days Remaining:', stats.estimatedDaysRemaining ?? '∞');

// Get per-license usage history
const usage = await api.user.getLicenseTokenUsage(license.key, 1, 20);
console.log('Total Records:', usage.total);
usage.records.forEach(record => {
  console.log(`${record.createdAt}: ${record.tokensUsed} tokens - ${record.purpose}`);
});
```

### 3. Top-up Tokens

```typescript
// Get available packages
const packages = await api.topup.getPackages();
console.log('Available packages:', packages);

// Create top-up transaction
const transaction = await api.topup.create({
  licenseKey: 'KGITON-2026-XXXXX-00001',
  tokenAmount: 100,
  paymentMethod: 'bank_transfer',
  paymentChannel: 'bca_va',
});

console.log('Payment URL:', transaction.paymentUrl);
console.log('VA Number:', transaction.vaNumber);

// Check transaction status
const status = await api.topup.getStatus(transaction.id);
console.log('Status:', status.status);
```

### 4. BLE Scale Connection

```typescript
// Initialize BLE service
const ble = new KGiTONBleService({
  autoReconnect: true,
  debug: true,
});

// Initialize (must be called first)
await ble.initialize();

// Listen for state changes
ble.addStateListener((state) => {
  console.log('Connection state:', state);
  // States: DISCONNECTED, SCANNING, CONNECTING, CONNECTED, AUTHENTICATED, ERROR
});

// Scan for devices
ble.startScan((device: ScaleDevice) => {
  console.log('Found device:', device.name, 'RSSI:', device.rssi);
});

// Connect to device
await ble.connect('DEVICE_ID');

// Authenticate with license key
await ble.authenticate('KGITON-2026-XXXXX-00001');

// Listen for weight data
ble.addWeightListener((data: WeightData) => {
  console.log('Weight:', data.value, data.unit);
  console.log('Stable:', data.isStable);
});

// Control buzzer
await ble.sendBuzzerCommand('BEEP');  // BEEP, BUZZ, LONG, OFF

// Tare (reset to zero)
await ble.sendTareCommand();

// Disconnect
await ble.disconnect();
```

---

## 📖 Documentation

Dokumentasi lengkap tersedia di folder `docs/`:

| # | Document | Description |
|---|----------|-------------|
| 1 | [Getting Started](docs/01_GETTING_STARTED.md) | Instalasi, konfigurasi, dan setup awal |
| 2 | [Authentication](docs/02_AUTHENTICATION.md) | Login, register, session, password reset |
| 3 | [License & Token](docs/03_LICENSE_TOKEN.md) | Validasi license, saldo token, penggunaan token |
| 4 | [Top-up & Payment](docs/04_TOPUP_PAYMENT.md) | Top-up token, metode pembayaran, status transaksi |
| 5 | [BLE Integration](docs/05_BLE_INTEGRATION.md) | Koneksi ke timbangan, streaming berat, buzzer |
| 6 | [API Reference](docs/06_API_REFERENCE.md) | Referensi lengkap semua API |
| 7 | [Troubleshooting](docs/07_TROUBLESHOOTING.md) | Masalah umum dan solusinya |

---

## 🏗️ Architecture

```
@kgiton/react-native-sdk
├── API Integration
│   ├── KGiTONApiClient        (Low-level HTTP client with retry)
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
│       ├── initialize()
│       ├── startScan() / stopScan()
│       ├── connect() / disconnect()
│       ├── authenticate()
│       ├── addWeightListener()
│       └── sendBuzzerCommand() / sendTareCommand()
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

## 🔧 Error Handling

SDK menggunakan typed exceptions untuk error handling:

```typescript
import { 
  KGiTONApiException,
  KGiTONAuthenticationException,
  KGiTONValidationException,
  KGiTONNotFoundException,
} from '@kgiton/react-native-sdk';

try {
  await api.auth.login({ email, password });
} catch (error) {
  if (error instanceof KGiTONAuthenticationException) {
    // Invalid credentials
    console.log('Invalid email or password');
  } else if (error instanceof KGiTONValidationException) {
    // Validation errors
    console.log('Validation:', error.errors);
  } else if (error instanceof KGiTONNotFoundException) {
    // Resource not found
    console.log('Not found');
  } else if (error instanceof KGiTONApiException) {
    // General API error
    console.log('API Error:', error.message, error.code);
  }
}
```

---

## 🔗 Related Packages

| Package | Description |
|---------|-------------|
| [@kgiton/react-native-admin-sdk](../react-native-admin-kgiton-sdk) | Admin SDK for super_admin operations |
| [kgiton_sdk](../flutter-kgiton-sdk) | Flutter SDK (equivalent features) |
| [kgiton_admin_sdk](../flutter-admin-kgiton-sdk) | Flutter Admin SDK |

---

## 📄 License

Proprietary License - PT KGiTON © 2026. All Rights Reserved.

See [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- 📧 Email: support@kgiton.com
- 📖 Documentation: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/kgiton/react-native-kgiton-sdk/issues)

---

<p align="center">
  <strong>PT KGiTON</strong> © 2026
</p>
