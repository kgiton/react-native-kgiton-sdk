# 🎫 License & Token

Panduan lengkap untuk manajemen license key dan token di @kgiton/react-native-sdk.

---

## 📋 Overview

### Konsep Dasar

- **License Key**: Kunci unik untuk mengidentifikasi pengguna/perangkat
- **Token**: "Pulsa" untuk menggunakan timbangan (1 token = 1 sesi penimbangan)
- **Trial Mode**: Mode percobaan dengan batas waktu tertentu

### Flow Penggunaan

```
Register dengan License Key
         ↓
    Login ke App
         ↓
   Cek Saldo Token
         ↓
  Token > 0? → Gunakan Token → Akses Timbangan
         ↓
  Token = 0? → Top-up Token
```

---

## 🔑 License Management

### Get Assigned License

Mendapatkan license yang di-assign ke user saat ini.

```typescript
const license = await api.user.getAssignedLicense();

console.log('License Key:', license.key);
console.log('Token Balance:', license.tokenBalance);
console.log('Is Trial:', license.isTrial);
console.log('Trial Expires:', license.trialExpiresAt);
console.log('Price per Token:', license.pricePerToken);
```

**Response Type:**
```typescript
interface License {
  key: string;
  tokenBalance: number;
  isTrial: boolean;
  trialExpiresAt: string | null;
  pricePerToken: number;
  isActive: boolean;
  assignedUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

### Validate License

Validasi license key (sebelum registrasi).

```typescript
const validation = await api.license.validate('KGITON-2026-XXXXX-00001');

if (validation.isValid) {
  console.log('License valid!');
  console.log('Already assigned:', validation.isAssigned);
} else {
  console.log('License invalid:', validation.error);
}
```

---

## 🪙 Token Management

### Check Token Balance

```typescript
// Via user profile
const profile = await api.user.getProfile();
console.log('Token Balance:', profile.tokenBalance);

// Via assigned license
const license = await api.user.getAssignedLicense();
console.log('Token Balance:', license.tokenBalance);
```

---

### Use Token

Gunakan 1 token untuk sesi penimbangan.

```typescript
try {
  const result = await api.user.useToken('KGITON-2026-XXXXX-00001');
  
  console.log('Token used successfully!');
  console.log('Remaining balance:', result.remainingBalance);
  
  // Sekarang bisa mengakses timbangan
  await startWeighingSession();
  
} catch (error) {
  if (error.code === 'INSUFFICIENT_TOKEN') {
    // Saldo tidak cukup
    Alert.alert(
      'Token Habis',
      'Saldo token Anda habis. Silakan top-up untuk melanjutkan.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Top-up', onPress: () => navigation.navigate('Topup') },
      ]
    );
  }
}
```

---

### Token Usage History

```typescript
// Get license transaction history
const history = await api.licenseTransaction.getAll({
  page: 1,
  limit: 20,
});

history.data.forEach((tx) => {
  console.log(`${tx.type}: ${tx.amount} tokens - ${tx.status}`);
});
```

---

## 🆓 Trial Mode

### Check Trial Status

```typescript
const license = await api.user.getAssignedLicense();

if (license.isTrial) {
  const expiresAt = new Date(license.trialExpiresAt);
  const now = new Date();
  const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
  
  console.log(`Trial expires in ${daysLeft} days`);
  
  if (daysLeft <= 3) {
    Alert.alert(
      'Trial Akan Berakhir',
      `Trial Anda akan berakhir dalam ${daysLeft} hari. Upgrade sekarang untuk melanjutkan.`,
      [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
      ]
    );
  }
}
```

---

## 📱 React Component Example

### License Info Card

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { KGiTONApiService } from '@kgiton/react-native-sdk';

const api = new KGiTONApiService({ baseUrl: 'https://api.kgiton.com' });

export default function LicenseInfoCard() {
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicense();
  }, []);

  const loadLicense = async () => {
    try {
      const data = await api.user.getAssignedLicense();
      setLicense(data);
    } catch (error) {
      console.error('Failed to load license:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (!license) {
    return (
      <View style={styles.card}>
        <Text style={styles.error}>No license assigned</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>License Info</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Key:</Text>
        <Text style={styles.value}>{license.key}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Token Balance:</Text>
        <Text style={[styles.value, styles.balance]}>
          {license.tokenBalance} tokens
        </Text>
      </View>
      
      {license.isTrial && (
        <View style={styles.trialBadge}>
          <Text style={styles.trialText}>
            🆓 Trial Mode - Expires: {new Date(license.trialExpiresAt).toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#666',
  },
  value: {
    fontWeight: '500',
  },
  balance: {
    color: '#2196F3',
    fontSize: 16,
  },
  trialBadge: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  trialText: {
    color: '#E65100',
    textAlign: 'center',
  },
  error: {
    color: '#F44336',
    textAlign: 'center',
  },
});
```

---

### Token Balance Hook

```typescript
// hooks/useTokenBalance.ts
import { useState, useEffect, useCallback } from 'react';
import { KGiTONApiService } from '@kgiton/react-native-sdk';

const api = new KGiTONApiService({ baseUrl: 'https://api.kgiton.com' });

export function useTokenBalance() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const license = await api.user.getAssignedLicense();
      setBalance(license.tokenBalance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const useToken = useCallback(async (licenseKey: string) => {
    try {
      const result = await api.user.useToken(licenseKey);
      setBalance(result.remainingBalance);
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    balance,
    loading,
    error,
    refresh,
    useToken,
  };
}
```

---

## ⚠️ Common Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `INSUFFICIENT_TOKEN` | Token habis | Top-up token |
| `LICENSE_NOT_FOUND` | License tidak ditemukan | Cek license key |
| `LICENSE_EXPIRED` | Trial berakhir | Upgrade ke paid |
| `LICENSE_NOT_ASSIGNED` | User belum punya license | Assign license |

---

<p align="center">
  <a href="02_AUTHENTICATION.md">← Authentication</a> •
  <a href="04_TOPUP_PAYMENT.md">Top-up & Payment →</a>
</p>
