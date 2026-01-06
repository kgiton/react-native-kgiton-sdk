# 🚀 Getting Started

Panduan ini akan membantu Anda memulai integrasi @kgiton/react-native-sdk ke dalam aplikasi React Native Anda.

---

## 📋 Prerequisites

Sebelum memulai, pastikan Anda memiliki:

- ✅ React Native >= 0.64.0
- ✅ Node.js >= 16.0.0
- ✅ Xcode (untuk iOS development)
- ✅ Android Studio (untuk Android development)
- ✅ License Key KGiTON (hubungi sales@kgiton.com)

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
    "@kgiton/react-native-sdk": "git+https://github.com/kgiton/react-native-kgiton-sdk.git",
    "react-native-ble-plx": "^3.1.2",
    "@react-native-async-storage/async-storage": "^1.21.0"
  }
}
```

### 2. iOS Configuration

**Install CocoaPods:**
```bash
cd ios && pod install && cd ..
```

**Edit `ios/[YourApp]/Info.plist`:**
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

**Edit `ios/Podfile`:**
```ruby
platform :ios, '12.0'
```

### 3. Android Configuration

**Edit `android/app/src/main/AndroidManifest.xml`:**
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Bluetooth Permissions -->
    <uses-permission android:name="android.permission.BLUETOOTH"/>
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
    
    <!-- Android 12+ Bluetooth Permissions -->
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" 
        android:usesPermissionFlags="neverForLocation"/>
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
    
    <!-- Location (required for BLE scanning on Android 10-11) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    
    <!-- Internet for API calls -->
    <uses-permission android:name="android.permission.INTERNET"/>
    
    <application ...>
        ...
    </application>
</manifest>
```

**Edit `android/app/build.gradle`:**
```groovy
android {
    defaultConfig {
        minSdkVersion 21  // Minimum Android 5.0
        // ...
    }
}
```

---

## 🔧 Basic Setup

### Initialize API Service

```typescript
import { KGiTONApiService } from '@kgiton/react-native-sdk';

// Create API service instance
const api = new KGiTONApiService({
  baseUrl: 'https://api.kgiton.com',  // Production URL
  // baseUrl: 'https://sandbox.api.kgiton.com',  // Sandbox URL
  timeout: 30000,  // 30 seconds timeout
  debug: __DEV__,  // Enable debug in development
});

// Export for use across app
export { api };
```

### Initialize BLE Service

```typescript
import { KGiTONBleService } from '@kgiton/react-native-sdk';

// Create BLE service instance
const ble = new KGiTONBleService({
  autoReconnect: true,  // Auto reconnect on disconnect
  debug: __DEV__,       // Enable debug in development
});

// Initialize (call once on app start)
async function initBle() {
  try {
    await ble.initialize();
    console.log('BLE initialized successfully');
  } catch (error) {
    console.error('BLE initialization failed:', error);
  }
}

export { ble };
```

---

## 📱 React Hook Example

```typescript
// hooks/useKGiTON.ts
import { useState, useEffect, useCallback } from 'react';
import { KGiTONApiService, KGiTONBleService, ConnectionState } from '@kgiton/react-native-sdk';

const api = new KGiTONApiService({ baseUrl: 'https://api.kgiton.com' });
const ble = new KGiTONBleService({ autoReconnect: true });

export function useKGiTON() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [weight, setWeight] = useState<number>(0);
  const [isStable, setIsStable] = useState<boolean>(false);

  // Initialize BLE
  useEffect(() => {
    const init = async () => {
      try {
        await ble.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Init failed:', error);
      }
    };
    init();

    // Add state listener
    const stateListener = ble.addStateListener((state) => {
      setConnectionState(state);
    });

    // Add weight listener
    const weightListener = ble.addWeightListener((data) => {
      setWeight(data.value);
      setIsStable(data.isStable);
    });

    return () => {
      stateListener.remove();
      weightListener.remove();
    };
  }, []);

  return {
    api,
    ble,
    isInitialized,
    connectionState,
    weight,
    isStable,
  };
}
```

---

## ✅ Verify Installation

Create a simple test screen:

```tsx
// screens/TestScreen.tsx
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { KGiTONApiService } from '@kgiton/react-native-sdk';

const api = new KGiTONApiService({ 
  baseUrl: 'https://api.kgiton.com',
  debug: true,
});

export default function TestScreen() {
  const [status, setStatus] = useState('Ready');

  const testConnection = async () => {
    try {
      setStatus('Testing...');
      
      // Try to login (will fail without valid credentials, but tests connection)
      await api.auth.login({
        email: 'test@example.com',
        password: 'test',
      });
      
      setStatus('✅ Connection successful!');
    } catch (error: any) {
      // Even if login fails, we can verify the API is reachable
      if (error.statusCode === 401) {
        setStatus('✅ API reachable (auth failed as expected)');
      } else {
        setStatus(`❌ Error: ${error.message}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KGiTON SDK Test</Text>
      <Text style={styles.status}>{status}</Text>
      <Button title="Test API Connection" onPress={testConnection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  status: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
});
```

---

## 🔜 Next Steps

Setelah instalasi berhasil, lanjut ke:

1. [Authentication](02_AUTHENTICATION.md) - Login dan register user
2. [License & Token](03_LICENSE_TOKEN.md) - Mengelola license dan token
3. [BLE Integration](05_BLE_INTEGRATION.md) - Koneksi ke timbangan

---

<p align="center">
  <a href="00_INDEX.md">← Index</a> •
  <a href="02_AUTHENTICATION.md">Authentication →</a>
</p>
