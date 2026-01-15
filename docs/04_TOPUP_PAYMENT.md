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

| Method | Code | Description |
|--------|------|-------------|
| Checkout Page | `checkout_page` | Halaman pembayaran Winpay |
| QRIS | `qris` | Scan QR untuk bayar |
| VA BRI | `va_bri` | Transfer ke Virtual Account BRI |
| VA BNI | `va_bni` | Transfer ke Virtual Account BNI |
| VA BCA | `va_bca` | Transfer ke Virtual Account BCA |
| VA Mandiri | `va_mandiri` | Transfer ke Virtual Account Mandiri |
| VA Permata | `va_permata` | Transfer ke Virtual Account Permata |
| VA BSI | `va_bsi` | Transfer ke Virtual Account BSI |
| VA CIMB | `va_cimb` | Transfer ke Virtual Account CIMB |

---

## 🚀 Quick Start

```typescript
import { KGiTONApiService } from '@kgiton/react-native-sdk';

const api = new KGiTONApiService({ baseUrl: 'https://api.kgiton.com' });

// Create top-up transaction
const transaction = await api.topup.request({
  licenseKey: 'KGITON-2026-XXXXX-00001',
  tokenCount: 100,
  paymentMethod: 'va_bca', // checkout_page, va_bri, va_bni, va_bca, qris, dll
});

console.log('Transaction ID:', transaction.transactionId);
console.log('Payment URL:', transaction.paymentUrl);
console.log('VA Number:', transaction.virtualAccount?.number);
console.log('QRIS URL:', transaction.qris?.qrImageUrl);
console.log('Amount:', transaction.amountToPay);
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
  console.log(`${method.name} (${method.id})`);
  console.log(`  Type: ${method.type}`);
  console.log(`  Enabled: ${method.enabled}`);
});
```

**Response Type:**
```typescript
interface PaymentMethodInfo {
  id: string;          // checkout_page, va_bri, va_bni, va_bca, qris, dll
  name: string;        // Nama display
  description?: string;
  type: 'checkout' | 'va' | 'qris';
  enabled: boolean;
}
```

---

### Create Top-up Transaction

```typescript
const transaction = await api.topup.request({
  licenseKey: 'KGITON-2026-XXXXX-00001',
  tokenCount: 100,
  paymentMethod: 'va_bca',  // checkout_page, va_bri, va_bni, va_bca, qris, dll
  
  // Optional
  customerPhone: '08123456789',
});

// Response
interface TopupData {
  transactionId: string;
  licenseKey: string;
  tokensRequested: number;
  amountToPay: number;        // Total payment amount
  pricePerToken: number;
  status: string;
  paymentMethod: string;      // checkout_page, va_bri, qris, dll
  gatewayProvider: string;
  
  // Payment details (varies by method)
  paymentUrl?: string;        // For checkout page redirect
  virtualAccount?: VirtualAccountInfo;  // For VA payments
  qris?: QRISInfo;            // For QRIS payment
  gatewayTransactionId?: string;
  
  expiresAt: string;
}

interface VirtualAccountInfo {
  number: string;
  name: string;
  bank: string;
}

interface QRISInfo {
  qrString: string | null;
  qrImageUrl: string;
}
```

---

### Check Transaction Status

```typescript
// Authenticated check
const status = await api.topup.getStatus(transactionId);

// Public check (no auth required)
const publicStatus = await api.topup.checkStatusPublic(transactionId);

switch (status.status) {
  case 'pending':
    console.log('Waiting for payment...');
    break;
    
  case 'success':
  case 'paid':
    console.log('Payment successful!');
    console.log('Tokens added:', status.tokensAdded);
    break;
    
  case 'expired':
    console.log('Transaction expired');
    break;
    
  case 'failed':
  case 'cancelled':
    console.log('Transaction failed/cancelled');
    break;
}

// Check transaction type
if (status.type === 'topup') {
  console.log('This is a token topup');
} else if (status.type === 'license_purchase') {
  console.log('This is a license purchase');
}
```

**Response Type:**
```typescript
interface TopupStatusData {
  transactionId: string;
  type: string;              // 'topup', 'license_purchase', 'license_rental'
  amount: number;
  status: TopupStatus;       // 'pending' | 'success' | 'paid' | 'expired' | 'failed' | 'cancelled'
  tokensAdded?: number;      // Only for topup
  tokensRequested?: number;  // Only for topup
  licenseKey?: string;       // Only for license transactions
  createdAt: string;
  paidAt?: string;
}
```

---

### Get Transaction History

```typescript
const history = await api.topup.getHistory();

history.forEach((tx) => {
  console.log(`${tx.transactionId}: ${tx.tokenCount} tokens - ${tx.status}`);
  console.log(`  Method: ${tx.paymentMethod}`);
  console.log(`  Amount: Rp ${tx.amount}`);
});
  console.log(`${tx.id}: ${tx.tokenAmount} tokens - ${tx.status}`);
});
```

**Response Type:**
```typescript
interface TopupHistoryItem {
  transactionId: string;
  licenseKey: string;
  tokenCount: number;
  amount: number;
  status: TopupStatus;
  paymentMethod: string;
  paidAt?: string;
  createdAt: string;
}
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
      const transaction = await api.topup.request({
        licenseKey: license.key,
        tokenCount: selectedPackage.tokenAmount,
        paymentMethod: selectedMethod,
      });

      // Handle different payment methods
      if (transaction.paymentUrl) {
        // Redirect to payment page
        await Linking.openURL(transaction.paymentUrl);
      } else if (transaction.virtualAccount) {
        // Show VA number
        Alert.alert(
          'Virtual Account',
          `Bank: ${transaction.virtualAccount.bank}\nVA: ${transaction.virtualAccount.number}\nAmount: Rp ${transaction.amountToPay}\nExpires: ${transaction.expiresAt}`,
          [{ text: 'OK' }]
        );
      } else if (transaction.qris) {
        // Show QRIS
        Alert.alert(
          'QRIS Payment',
          `Scan QR code untuk membayar Rp ${transaction.amountToPay}`,
          [{ text: 'OK' }]
        );
        // Navigate to QR display screen
        // navigation.navigate('QRISPayment', { qrisUrl: transaction.qris.qrImageUrl });
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
      <View style={styles.channelRow}>
        {paymentMethods.filter(m => m.enabled).map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.channelButton,
              selectedMethod === method.id && styles.selectedChannel,
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <Text>{method.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
  const [transaction, setTransaction] = useState<TopupStatusData | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!transactionId) return;

    const checkStatus = async () => {
      try {
        const data = await api.topup.getStatus(transactionId);
        setTransaction(data);
        setStatus(data.status);

        // Stop polling if payment is complete or failed
        if (['paid', 'success', 'expired', 'failed', 'cancelled'].includes(data.status)) {
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

## 🔄 Sync Transaction Status

Untuk polling status transaksi secara langsung dari payment gateway:

```typescript
const syncPaymentStatus = async (transactionId: string) => {
  try {
    const result = await api.topup.syncStatus(transactionId);
    
    console.log('Sync Result:', result);
    console.log('Status:', result.status);
    console.log('Was Updated:', result.updated);
    
    if (result.updated && result.status === 'success') {
      Alert.alert('Success', 'Payment confirmed!');
      // Refresh token balance
    }
    
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
```

**Catatan:**
- Hanya mendukung QRIS dan Virtual Account
- Checkout page tidak bisa di-poll (harus menunggu webhook)

---

<p align="center">
  <a href="03_LICENSE_TOKEN.md">← License & Token</a> •
  <a href="05_BLE_INTEGRATION.md">BLE Integration →</a>
</p>
