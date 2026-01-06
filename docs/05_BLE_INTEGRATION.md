# 🔵 BLE Integration

Panduan lengkap untuk integrasi Bluetooth Low Energy dengan timbangan KGiTON.

---

## 📋 Overview

### Flow Koneksi

```
Initialize BLE Manager
        ↓
   Request Permissions
        ↓
  Scan for Devices
        ↓
   Connect to Device
        ↓
 Authenticate with License Key
        ↓
 Start Weight Streaming
        ↓
  Control Buzzer/Tare
        ↓
     Disconnect
```

### Connection States

| State | Description |
|-------|-------------|
| `DISCONNECTED` | Tidak terhubung |
| `SCANNING` | Sedang scan perangkat |
| `CONNECTING` | Sedang menghubungkan |
| `CONNECTED` | Terhubung (belum autentikasi) |
| `AUTHENTICATED` | Terhubung dan terautentikasi |
| `ERROR` | Terjadi error |

---

## 🚀 Quick Start

```typescript
import { KGiTONBleService, ConnectionState, WeightData } from '@kgiton/react-native-sdk';

const ble = new KGiTONBleService({
  autoReconnect: true,
  debug: true,
});

// Initialize
await ble.initialize();

// Scan
ble.startScan((device) => {
  console.log('Found:', device.name, device.rssi);
});

// Connect
await ble.connect('DEVICE_ID');

// Authenticate
await ble.authenticate('LICENSE-KEY');

// Listen to weight
ble.addWeightListener((data) => {
  console.log('Weight:', data.value, data.unit);
});
```

---

## 📖 API Reference

### Initialize

Inisialisasi BLE manager. Harus dipanggil sekali sebelum operasi lain.

```typescript
const ble = new KGiTONBleService({
  // Auto reconnect when disconnected unexpectedly
  autoReconnect: true,
  
  // Enable debug logging
  debug: __DEV__,
});

try {
  await ble.initialize();
  console.log('BLE initialized');
} catch (error) {
  if (error.code === 'BLE_NOT_SUPPORTED') {
    Alert.alert('Error', 'Device does not support Bluetooth LE');
  } else if (error.code === 'BLE_PERMISSION_DENIED') {
    Alert.alert('Error', 'Bluetooth permission denied');
  }
}
```

---

### State Listener

Listen untuk perubahan state koneksi.

```typescript
const listener = ble.addStateListener((state: ConnectionState) => {
  switch (state) {
    case ConnectionState.DISCONNECTED:
      console.log('Disconnected');
      break;
    case ConnectionState.SCANNING:
      console.log('Scanning for devices...');
      break;
    case ConnectionState.CONNECTING:
      console.log('Connecting...');
      break;
    case ConnectionState.CONNECTED:
      console.log('Connected, authenticating...');
      break;
    case ConnectionState.AUTHENTICATED:
      console.log('Ready to use!');
      break;
    case ConnectionState.ERROR:
      console.log('Error occurred');
      break;
  }
});

// Remove listener when done
listener.remove();

// Or get current state
const currentState = ble.getConnectionState();
```

---

### Scanning

Scan untuk perangkat KGiTON terdekat.

```typescript
// Start scan
ble.startScan((device: ScaleDevice) => {
  console.log('Device found:');
  console.log('  ID:', device.id);
  console.log('  Name:', device.name);
  console.log('  RSSI:', device.rssi, 'dBm');
  console.log('  Connectable:', device.isConnectable);
});

// Scan will automatically stop after timeout (default: 10 seconds)

// Or stop manually
ble.stopScan();
```

**ScaleDevice Type:**
```typescript
interface ScaleDevice {
  id: string;           // Bluetooth device ID
  name: string;         // Device name (e.g., "KGiTON-001")
  rssi?: number;        // Signal strength in dBm
  isConnectable: boolean;
}
```

---

### Connect

Terhubung ke perangkat.

```typescript
try {
  await ble.connect('DEVICE_ID');
  console.log('Connected!');
} catch (error) {
  if (error.code === 'DEVICE_NOT_FOUND') {
    Alert.alert('Error', 'Device not found. Make sure it is powered on.');
  } else if (error.code === 'CONNECTION_TIMEOUT') {
    Alert.alert('Error', 'Connection timed out. Try again.');
  }
}
```

---

### Authenticate

Autentikasi dengan license key. Diperlukan sebelum bisa menerima data berat.

```typescript
try {
  await ble.authenticate('KGITON-2026-XXXXX-00001');
  console.log('Authenticated!');
} catch (error) {
  if (error.code === 'INVALID_LICENSE') {
    Alert.alert('Error', 'License key is invalid');
  } else if (error.code === 'LICENSE_EXPIRED') {
    Alert.alert('Error', 'License has expired');
  }
}
```

---

### Weight Listener

Listen untuk data berat realtime.

```typescript
const listener = ble.addWeightListener((data: WeightData) => {
  console.log('Weight:', data.value);
  console.log('Unit:', data.unit);        // 'kg', 'g', 'lb', 'oz'
  console.log('Stable:', data.isStable);  // true if reading is stable
  console.log('Timestamp:', data.timestamp);
});

// Remove listener when done
listener.remove();
```

**WeightData Type:**
```typescript
interface WeightData {
  value: number;        // Weight value
  unit: 'kg' | 'g' | 'lb' | 'oz';
  isStable: boolean;    // True if weight is stable
  timestamp: number;    // Unix timestamp
}
```

---

### Buzzer Control

Kontrol buzzer pada timbangan.

```typescript
// Beep sound (short)
await ble.sendBuzzerCommand('BEEP');

// Buzz sound (medium)
await ble.sendBuzzerCommand('BUZZ');

// Long beep
await ble.sendBuzzerCommand('LONG');

// Turn off buzzer
await ble.sendBuzzerCommand('OFF');
```

---

### Tare (Zero)

Reset timbangan ke nol.

```typescript
await ble.sendTareCommand();
console.log('Tare complete');
```

---

### Disconnect

Putuskan koneksi.

```typescript
await ble.disconnect();
console.log('Disconnected');
```

---

### Destroy

Cleanup resources saat app ditutup.

```typescript
// Call when component unmounts or app closes
ble.destroy();
```

---

## 📱 React Component Examples

### Scale Connection Screen

```tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  StyleSheet, Alert, ActivityIndicator 
} from 'react-native';
import { 
  KGiTONBleService, 
  ConnectionState, 
  ScaleDevice 
} from '@kgiton/react-native-sdk';

const ble = new KGiTONBleService({ autoReconnect: true, debug: true });

export default function ScaleConnectScreen({ navigation }) {
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );

  useEffect(() => {
    initBle();
    
    const listener = ble.addStateListener((state) => {
      setConnectionState(state);
      
      if (state === ConnectionState.AUTHENTICATED) {
        navigation.navigate('Scale');
      }
    });

    return () => {
      listener.remove();
    };
  }, []);

  const initBle = async () => {
    try {
      await ble.initialize();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const startScan = () => {
    setDevices([]);
    setScanning(true);
    
    ble.startScan((device) => {
      setDevices((prev) => {
        // Avoid duplicates
        if (prev.find((d) => d.id === device.id)) {
          return prev;
        }
        return [...prev, device];
      });
    });

    // Stop after 10 seconds
    setTimeout(() => {
      ble.stopScan();
      setScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device: ScaleDevice) => {
    setConnecting(true);
    try {
      await ble.connect(device.id);
      
      // Get license key from user profile
      const api = new KGiTONApiService({ baseUrl: 'https://api.kgiton.com' });
      const license = await api.user.getAssignedLicense();
      
      await ble.authenticate(license.key);
      
      // Navigation happens in state listener
    } catch (error) {
      Alert.alert('Connection Failed', error.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect to Scale</Text>
      
      <TouchableOpacity
        style={[styles.scanButton, scanning && styles.scanningButton]}
        onPress={startScan}
        disabled={scanning}
      >
        {scanning ? (
          <>
            <ActivityIndicator color="#fff" />
            <Text style={styles.scanButtonText}>Scanning...</Text>
          </>
        ) : (
          <Text style={styles.scanButtonText}>Scan for Devices</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        Found Devices ({devices.length})
      </Text>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deviceCard}
            onPress={() => connectToDevice(item)}
            disabled={connecting}
          >
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceRssi}>
                Signal: {item.rssi} dBm
              </Text>
            </View>
            {connecting ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.connectText}>Connect</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {scanning ? 'Searching...' : 'No devices found. Tap Scan to search.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  scanButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  scanningButton: { backgroundColor: '#64B5F6' },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginVertical: 16 },
  deviceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 16, fontWeight: '600' },
  deviceRssi: { fontSize: 12, color: '#666', marginTop: 4 },
  connectText: { color: '#2196F3', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 32 },
});
```

---

### Weight Display Screen

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { KGiTONBleService, WeightData } from '@kgiton/react-native-sdk';

const ble = new KGiTONBleService();

export default function WeightScreen() {
  const [weight, setWeight] = useState<number>(0);
  const [unit, setUnit] = useState<string>('kg');
  const [isStable, setIsStable] = useState<boolean>(false);

  useEffect(() => {
    const listener = ble.addWeightListener((data: WeightData) => {
      setWeight(data.value);
      setUnit(data.unit);
      setIsStable(data.isStable);
    });

    return () => {
      listener.remove();
    };
  }, []);

  const handleTare = async () => {
    try {
      await ble.sendTareCommand();
    } catch (error) {
      console.error('Tare failed:', error);
    }
  };

  const handleBeep = async () => {
    try {
      await ble.sendBuzzerCommand('BEEP');
    } catch (error) {
      console.error('Beep failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.weightDisplay}>
        <Text style={styles.weightValue}>
          {weight.toFixed(2)}
        </Text>
        <Text style={styles.weightUnit}>{unit}</Text>
        {isStable && (
          <View style={styles.stableBadge}>
            <Text style={styles.stableText}>STABLE</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleTare}>
          <Text style={styles.controlText}>⚖️ Tare</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={handleBeep}>
          <Text style={styles.controlText}>🔔 Beep</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  weightDisplay: { alignItems: 'center' },
  weightValue: { fontSize: 72, fontWeight: 'bold', color: '#00ff88', fontFamily: 'monospace' },
  weightUnit: { fontSize: 24, color: '#666', marginTop: 8 },
  stableBadge: { 
    backgroundColor: '#00ff88', 
    paddingHorizontal: 16, 
    paddingVertical: 4, 
    borderRadius: 16, 
    marginTop: 16 
  },
  stableText: { color: '#1a1a2e', fontWeight: 'bold' },
  controls: { flexDirection: 'row', marginTop: 48, gap: 16 },
  controlButton: { 
    backgroundColor: '#2a2a4a', 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    borderRadius: 12 
  },
  controlText: { color: '#fff', fontSize: 16 },
});
```

---

## ⚠️ Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "BLE not supported" | Device doesn't support BLE | Use compatible device |
| "Permission denied" | Bluetooth permission not granted | Request permission |
| "Device not found" | Device is off or too far | Turn on device, move closer |
| "Connection timeout" | Weak signal or interference | Move closer, retry |
| "Authentication failed" | Invalid license key | Check license key |
| "No weight data" | Not authenticated | Call authenticate() first |

### Debug Tips

```typescript
// Enable debug mode
const ble = new KGiTONBleService({ debug: true });

// Check BLE state
const state = await ble.manager.state();
console.log('BLE State:', state); // PoweredOn, PoweredOff, etc.
```

---

<p align="center">
  <a href="04_TOPUP_PAYMENT.md">← Top-up & Payment</a> •
  <a href="06_API_REFERENCE.md">API Reference →</a>
</p>
