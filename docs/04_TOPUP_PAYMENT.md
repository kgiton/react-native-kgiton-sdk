# 💳 Top-up & Payment

Panduan lengkap untuk top-up token melalui berbagai metode pembayaran.

---

## 📋 Overview

### Payment Flow

```
Pilih Jumlah Token
        ↓
  Pilih Metode Pembayaran
        ↓
  Buat Transaksi (API)
        ↓
  Redirect ke Payment Gateway
        ↓
  User Bayar (VA/QRIS/dll)
        ↓
  Webhook Notifikasi
        ↓
  Token Ditambahkan
```

### Metode Pembayaran

| Method | Description | Status |
|--------|-------------|--------|
| Bank Transfer (VA) | Virtual Account BCA, BNI, Mandiri, dll | ✅ Active |
| QRIS | Scan QR untuk pembayaran | ✅ Active |
| E-Wallet | OVO, GoPay, Dana, dll | ✅ Active |
| Credit Card | Visa, Mastercard | ✅ Active |
| Checkout Page | Redirect ke halaman pembayaran | ✅ Active |

---

## 🚀 Quick Start

```typescript
import { KGiTONApiService } from '@kgiton/react-native-sdk';

const api = new KGiTONApiService({ baseUrl: 'https://api.kgiton.com' });

// Create top-up transaction
const transaction = await api.topup.create({
  licenseKey: 'KGITON-2026-XXXXX-00001',
  tokenAmount: 100,
  paymentMethod: 'bank_transfer',
  paymentChannel: 'bca_va',
});

console.log('Payment URL:', transaction.paymentUrl);
console.log('VA Number:', transaction.vaNumber);
console.log('Amount:', transaction.amount);
console.log('Expires:', transaction.expiresAt);
```

---

## 📖 API Reference

### Get Available Packages

```typescript
const packages = await api.topup.getPackages();

packages.forEach((pkg) => {
  console.log(`${pkg.name}: ${pkg.tokenAmount} tokens - Rp ${pkg.price}`);
  console.log(`Bonus: ${pkg.bonusTokens} tokens`);
});
```

**Response Type:**
```typescript
interface TopupPackage {
  id: string;
  name: string;
  tokenAmount: number;
  bonusTokens: number;
  price: number;
  currency: string;
  isActive: boolean;
}
```

---

### Get Payment Methods

```typescript
const methods = await api.topup.getPaymentMethods();

methods.forEach((method) => {
  console.log(`${method.name} (${method.code})`);
  method.channels.forEach((channel) => {
    console.log(`  - ${channel.name}: ${channel.code}`);
  });
});
```

**Response Type:**
```typescript
interface PaymentMethod {
  code: string;
  name: string;
  channels: PaymentChannel[];
}

interface PaymentChannel {
  code: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: 'fixed' | 'percentage';
}
```

---

### Create Top-up Transaction

```typescript
const transaction = await api.topup.create({
  licenseKey: 'KGITON-2026-XXXXX-00001',
  tokenAmount: 100,
  paymentMethod: 'bank_transfer',  // bank_transfer, ewallet, qris, credit_card
  paymentChannel: 'bca_va',        // bca_va, bni_va, ovo, gopay, qris, etc
  
  // Optional
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '08123456789',
});

// Response
interface TopupTransaction {
  id: string;
  licenseKey: string;
  tokenAmount: number;
  amount: number;           // Total payment amount (including fee)
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'failed' | 'cancelled';
  paymentMethod: string;
  paymentChannel: string;
  
  // Payment details (varies by method)
  paymentUrl?: string;      // For checkout page redirect
  vaNumber?: string;        // For virtual account
  qrCode?: string;          // For QRIS (base64 image)
  qrString?: string;        // For QRIS (raw string)
  
  expiresAt: string;
  createdAt: string;
}
```

---

### Check Transaction Status

```typescript
const status = await api.topup.getStatus(transactionId);

switch (status.status) {
  case 'pending':
    console.log('Waiting for payment...');
    console.log('Expires at:', status.expiresAt);
    break;
    
  case 'paid':
    console.log('Payment successful!');
    console.log('Tokens added:', status.tokenAmount);
    break;
    
  case 'expired':
    console.log('Transaction expired');
    break;
    
  case 'failed':
    console.log('Payment failed:', status.failureReason);
    break;
}
```

---

### Get Transaction History

```typescript
const history = await api.topup.getHistory({
  page: 1,
  limit: 20,
  status: 'paid',  // optional: filter by status
});

console.log('Total transactions:', history.total);
history.data.forEach((tx) => {
  console.log(`${tx.id}: ${tx.tokenAmount} tokens - ${tx.status}`);
});
```

---

### Cancel Transaction

```typescript
// Only pending transactions can be cancelled
await api.topup.cancel(transactionId);
console.log('Transaction cancelled');
```

---

## 📱 React Component Examples

### Top-up Screen

```tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, 
  StyleSheet, Alert, Linking 
} from 'react-native';
import { KGiTONApiService } from '@kgiton/react-native-sdk';

const api = new KGiTONApiService({ baseUrl: 'https://api.kgiton.com' });

export default function TopupScreen() {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pkgs, methods] = await Promise.all([
        api.topup.getPackages(),
        api.topup.getPaymentMethods(),
      ]);
      setPackages(pkgs);
      setPaymentMethods(methods);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleTopup = async () => {
    if (!selectedPackage || !selectedMethod) {
      Alert.alert('Error', 'Pilih paket dan metode pembayaran');
      return;
    }

    setLoading(true);
    try {
      const license = await api.user.getAssignedLicense();
      const transaction = await api.topup.create({
        licenseKey: license.key,
        tokenAmount: selectedPackage.tokenAmount,
        paymentMethod: selectedMethod.method,
        paymentChannel: selectedMethod.channel,
      });

      // Handle different payment methods
      if (transaction.paymentUrl) {
        // Redirect to payment page
        await Linking.openURL(transaction.paymentUrl);
      } else if (transaction.vaNumber) {
        // Show VA number
        Alert.alert(
          'Virtual Account',
          `Bank: ${transaction.paymentChannel}\nVA: ${transaction.vaNumber}\nAmount: Rp ${transaction.amount}\nExpires: ${new Date(transaction.expiresAt).toLocaleString()}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top-up Token</Text>
      
      {/* Package Selection */}
      <Text style={styles.sectionTitle}>Pilih Paket</Text>
      <FlatList
        data={packages}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.packageCard,
              selectedPackage?.id === item.id && styles.selectedCard,
            ]}
            onPress={() => setSelectedPackage(item)}
          >
            <Text style={styles.packageTokens}>{item.tokenAmount} Tokens</Text>
            {item.bonusTokens > 0 && (
              <Text style={styles.bonus}>+{item.bonusTokens} Bonus</Text>
            )}
            <Text style={styles.price}>Rp {item.price.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Payment Method Selection */}
      <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
      {paymentMethods.map((method) => (
        <View key={method.code}>
          <Text style={styles.methodTitle}>{method.name}</Text>
          <View style={styles.channelRow}>
            {method.channels.map((channel) => (
              <TouchableOpacity
                key={channel.code}
                style={[
                  styles.channelButton,
                  selectedMethod?.channel === channel.code && styles.selectedChannel,
                ]}
                onPress={() => setSelectedMethod({ method: method.code, channel: channel.code })}
              >
                <Text>{channel.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleTopup}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? 'Processing...' : 'Bayar Sekarang'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginVertical: 12 },
  packageCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 120,
    alignItems: 'center',
  },
  selectedCard: { borderColor: '#2196F3' },
  packageTokens: { fontSize: 18, fontWeight: 'bold' },
  bonus: { color: '#4CAF50', marginTop: 4 },
  price: { fontSize: 14, color: '#666', marginTop: 8 },
  methodTitle: { fontSize: 14, color: '#666', marginTop: 8 },
  channelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  channelButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedChannel: { borderColor: '#2196F3', backgroundColor: '#E3F2FD' },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  disabledButton: { backgroundColor: '#ccc' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
```

---

### Payment Status Polling

```typescript
// hooks/usePaymentStatus.ts
import { useState, useEffect, useRef } from 'react';
import { KGiTONApiService } from '@kgiton/react-native-sdk';

const api = new KGiTONApiService({ baseUrl: 'https://api.kgiton.com' });

export function usePaymentStatus(transactionId: string) {
  const [status, setStatus] = useState<string>('pending');
  const [transaction, setTransaction] = useState(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!transactionId) return;

    const checkStatus = async () => {
      try {
        const data = await api.topup.getStatus(transactionId);
        setTransaction(data);
        setStatus(data.status);

        // Stop polling if payment is complete or failed
        if (['paid', 'expired', 'failed', 'cancelled'].includes(data.status)) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      } catch (error) {
        console.error('Failed to check status:', error);
      }
    };

    // Check immediately
    checkStatus();

    // Then poll every 5 seconds
    intervalRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [transactionId]);

  return { status, transaction };
}
```

---

## ⚠️ Common Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `INVALID_AMOUNT` | Jumlah tidak valid | Cek minimum amount |
| `INVALID_PAYMENT_METHOD` | Metode tidak tersedia | Gunakan metode lain |
| `TRANSACTION_EXPIRED` | Transaksi kadaluarsa | Buat transaksi baru |
| `LICENSE_NOT_FOUND` | License tidak ditemukan | Cek license key |

---

<p align="center">
  <a href="03_LICENSE_TOKEN.md">← License & Token</a> •
  <a href="05_BLE_INTEGRATION.md">BLE Integration →</a>
</p>
