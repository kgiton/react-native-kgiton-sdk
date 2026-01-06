# 🔧 Troubleshooting

Panduan untuk mengatasi masalah umum saat menggunakan @kgiton/react-native-sdk.

---

## 📋 Table of Contents

- [Installation Issues](#installation-issues)
- [API Errors](#api-errors)
- [BLE Connection Issues](#ble-connection-issues)
- [Authentication Issues](#authentication-issues)
- [Payment Issues](#payment-issues)
- [Debug Mode](#debug-mode)

---

## Installation Issues

### ❌ Pod Install Failed (iOS)

**Error:**
```
[!] CocoaPods could not find compatible versions for pod "react-native-ble-plx"
```

**Solution:**
```bash
cd ios
pod deintegrate
pod cache clean --all
pod install
```

---

### ❌ Build Failed on Android

**Error:**
```
Execution failed for task ':react-native-ble-plx:compileDebugKotlin'
```

**Solution:**

Edit `android/build.gradle`:
```groovy
buildscript {
    ext {
        kotlinVersion = "1.8.0"  // Update Kotlin version
    }
}
```

Then:
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

---

### ❌ Metro Bundler Error

**Error:**
```
Unable to resolve module '@kgiton/react-native-sdk'
```

**Solution:**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Or
npx react-native start --reset-cache
```

---

## API Errors

### ❌ 401 Unauthorized

**Causes:**
1. Access token expired
2. Invalid credentials
3. Token not set

**Solution:**
```typescript
try {
  await api.auth.login({ email, password });
} catch (error) {
  if (error instanceof KGiTONAuthenticationException) {
    // Token expired - try refresh
    try {
      await api.auth.refreshToken();
    } catch (refreshError) {
      // Refresh failed - need to login again
      navigation.navigate('Login');
    }
  }
}
```

---

### ❌ 403 Forbidden

**Causes:**
1. User doesn't have permission
2. Resource belongs to another user
3. Account not verified

**Solution:**
```typescript
if (error instanceof KGiTONAuthorizationException) {
  Alert.alert('Access Denied', 'You do not have permission for this action.');
}
```

---

### ❌ 404 Not Found

**Causes:**
1. Resource doesn't exist
2. Wrong endpoint
3. Invalid ID

**Solution:**
```typescript
if (error instanceof KGiTONNotFoundException) {
  Alert.alert('Not Found', 'The requested resource was not found.');
}
```

---

### ❌ 429 Too Many Requests

**Causes:**
1. Rate limit exceeded

**Solution:**
```typescript
if (error instanceof KGiTONRateLimitException) {
  Alert.alert(
    'Rate Limited',
    'Too many requests. Please wait a moment and try again.'
  );
  
  // Wait and retry
  await new Promise(resolve => setTimeout(resolve, 60000));
}
```

---

### ❌ Network Error

**Causes:**
1. No internet connection
2. Server unreachable
3. Timeout

**Solution:**
```typescript
import NetInfo from '@react-native-community/netinfo';

// Check connection before API call
const netInfo = await NetInfo.fetch();
if (!netInfo.isConnected) {
  Alert.alert('No Connection', 'Please check your internet connection.');
  return;
}

// Handle network error
if (error instanceof KGiTONNetworkException) {
  Alert.alert('Connection Error', 'Unable to connect to server. Please try again.');
}
```

---

## BLE Connection Issues

### ❌ "Bluetooth is not available"

**Causes:**
1. Device doesn't support BLE
2. Bluetooth is turned off

**Solution:**
```typescript
import { Platform, PermissionsAndroid, Linking } from 'react-native';

// Check if BLE is available
const bleState = await ble.manager.state();

if (bleState === 'PoweredOff') {
  if (Platform.OS === 'ios') {
    Alert.alert(
      'Bluetooth Off',
      'Please turn on Bluetooth in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: () => Linking.openURL('App-Prefs:Bluetooth') },
      ]
    );
  } else {
    // Android - can prompt to enable
    await ble.manager.enable(); // Prompts user
  }
}
```

---

### ❌ "Permission denied"

**Causes:**
1. Bluetooth permission not granted
2. Location permission not granted (Android)

**Solution (Android):**
```typescript
import { PermissionsAndroid, Platform } from 'react-native';

async function requestBlePermissions() {
  if (Platform.OS !== 'android') return true;

  const apiLevel = Platform.Version;
  
  if (apiLevel >= 31) {
    // Android 12+
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    
    return Object.values(results).every(
      result => result === PermissionsAndroid.RESULTS.GRANTED
    );
  } else {
    // Android 11 and below
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
}
```

**Solution (iOS):**
Make sure `Info.plist` has:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app uses Bluetooth to connect to KGiTON scales</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app uses Bluetooth to connect to KGiTON scales</string>
```

---

### ❌ "Device not found"

**Causes:**
1. Device is powered off
2. Device is too far away
3. Device is connected to another phone

**Solution:**
```typescript
// Extend scan timeout
ble.startScan((device) => {
  console.log('Found:', device);
}, {
  timeout: 30000, // 30 seconds
});

// Check RSSI for signal strength
ble.startScan((device) => {
  if (device.rssi > -70) {
    console.log('Good signal:', device.name);
  } else {
    console.log('Weak signal:', device.name, device.rssi);
  }
});
```

---

### ❌ "Connection timeout"

**Causes:**
1. Weak Bluetooth signal
2. Device is busy
3. Interference

**Solution:**
```typescript
// Retry with exponential backoff
async function connectWithRetry(deviceId: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await ble.connect(deviceId);
      return; // Success
    } catch (error) {
      console.log(`Connection attempt ${i + 1} failed`);
      
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

### ❌ "Authentication failed"

**Causes:**
1. Invalid license key
2. License expired
3. License assigned to different user

**Solution:**
```typescript
try {
  await ble.authenticate(licenseKey);
} catch (error) {
  if (error.code === 'INVALID_LICENSE') {
    Alert.alert('Invalid License', 'Please check your license key.');
  } else if (error.code === 'LICENSE_EXPIRED') {
    Alert.alert('License Expired', 'Please renew your license.');
  } else if (error.code === 'LICENSE_NOT_ASSIGNED') {
    Alert.alert('License Not Assigned', 'This license is not assigned to you.');
  }
}
```

---

### ❌ No weight data received

**Causes:**
1. Not authenticated
2. Notification not enabled
3. Connection lost

**Solution:**
```typescript
// Check connection state
const state = ble.getConnectionState();

if (state !== ConnectionState.AUTHENTICATED) {
  console.log('Not authenticated, current state:', state);
  
  // Re-authenticate
  await ble.authenticate(licenseKey);
}

// Check if weight listener is active
const listener = ble.addWeightListener((data) => {
  console.log('Weight received:', data);
});

// Make sure to handle disconnection
ble.addStateListener((state) => {
  if (state === ConnectionState.DISCONNECTED) {
    console.log('Connection lost!');
    // Attempt reconnect
  }
});
```

---

## Authentication Issues

### ❌ "Email already registered"

**Solution:**
```typescript
try {
  await api.auth.register({ email, password, confirmPassword, licenseKey });
} catch (error) {
  if (error instanceof KGiTONConflictException) {
    Alert.alert(
      'Email Already Registered',
      'Would you like to login instead?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]
    );
  }
}
```

---

### ❌ "Invalid license key"

**Solution:**
```typescript
// Validate license before registration
const validation = await api.license.validate(licenseKey);

if (!validation.isValid) {
  Alert.alert('Invalid License', 'Please check your license key.');
  return;
}

if (validation.isAssigned) {
  Alert.alert('License In Use', 'This license is already assigned to another user.');
  return;
}

// Proceed with registration
```

---

### ❌ Token expired during use

**Solution:**
```typescript
// Wrap API calls with auto-refresh
async function apiCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof KGiTONAuthenticationException) {
      // Try refresh
      try {
        await api.auth.refreshToken();
        return await fn(); // Retry
      } catch (refreshError) {
        // Refresh failed, logout
        await api.auth.logout();
        throw refreshError;
      }
    }
    throw error;
  }
}

// Usage
const profile = await apiCall(() => api.user.getProfile());
```

---

## Payment Issues

### ❌ Transaction stuck on pending

**Solution:**
```typescript
// Check transaction status
const status = await api.topup.getStatus(transactionId);

if (status.status === 'pending') {
  // Check if expired
  if (new Date(status.expiresAt) < new Date()) {
    Alert.alert('Transaction Expired', 'Please create a new transaction.');
    return;
  }
  
  // Payment might be processing
  Alert.alert(
    'Payment Pending',
    'Your payment is being processed. Please wait or check again later.'
  );
}
```

---

### ❌ Payment completed but tokens not added

**Causes:**
1. Webhook not received
2. Server processing delay

**Solution:**
```typescript
// Wait and check again
await new Promise(resolve => setTimeout(resolve, 5000));

const status = await api.topup.getStatus(transactionId);

if (status.status === 'paid') {
  // Check token balance
  const license = await api.user.getAssignedLicense();
  console.log('Current balance:', license.tokenBalance);
} else {
  // Contact support with transaction ID
  Alert.alert(
    'Payment Issue',
    `Please contact support with transaction ID: ${transactionId}`
  );
}
```

---

## Debug Mode

Enable debug logging for troubleshooting:

```typescript
// API
const api = new KGiTONApiService({
  baseUrl: 'https://api.kgiton.com',
  debug: true,  // Logs all API requests/responses
});

// BLE
const ble = new KGiTONBleService({
  debug: true,  // Logs all BLE operations
});
```

### Debug Output Example

```
[KGiTON API] → POST /auth/login {"email":"user@example.com","password":"***"}
[KGiTON API] ← 200 {"success":true,"data":{"accessToken":"..."}}

[KGiTON BLE] Initializing BLE manager...
[KGiTON BLE] BLE state: PoweredOn
[KGiTON BLE] Starting scan...
[KGiTON BLE] Device found: KGiTON-001 (RSSI: -45)
[KGiTON BLE] Connecting to device...
[KGiTON BLE] Connected
[KGiTON BLE] Authenticating with license...
[KGiTON BLE] Authenticated successfully
[KGiTON BLE] Weight: 1.234 kg (stable: true)
```

---

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check the logs** - Enable debug mode
2. **Check internet connection** - For API issues
3. **Check Bluetooth** - For BLE issues
4. **Update the SDK** - Make sure you have the latest version
5. **Contact support** - Email support@kgiton.com with:
   - Device model
   - OS version
   - SDK version
   - Error message
   - Debug logs

---

<p align="center">
  <a href="06_API_REFERENCE.md">← API Reference</a> •
  <a href="00_INDEX.md">Index →</a>
</p>
