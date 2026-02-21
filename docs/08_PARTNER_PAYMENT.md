# 🤝 Partner Payment API

Panduan untuk menggunakan Partner Payment API - memungkinkan partner menghasilkan pembayaran QRIS atau Checkout Page untuk transaksi mereka sendiri.

---

## 📋 Overview

Partner Payment API memungkinkan aplikasi partner (misalnya: Huba POS) untuk:
- Generate pembayaran QRIS untuk pelanggan mereka
- Generate halaman checkout untuk pelanggan mereka
- Menerima callback webhook saat pembayaran berhasil

### Payment Flow

**Option 1: Webhook (Real-time)**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Partner App    │────▶│  KGiTON API     │────▶│  Payment        │
│  Request        │     │  Generate       │     │  Gateway        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                       │
┌─────────────────┐     ┌─────────────────┐            │
│  Partner App    │◀────│  Webhook        │◀───────────┘
│  Receive        │     │  Callback       │
└─────────────────┘     └─────────────────┘
```

**Option 2: Polling (Independent, tanpa webhook)**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Partner App    │────▶│  KGiTON API     │────▶│  Payment        │
│  Generate       │     │                 │     │  Gateway        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       ▲
        │                       │ (polling setiap 5 detik)
        └───────────────────────┘
        checkStatus(transactionId)
```

### Biaya
- Setiap request pembayaran akan **mengurangi 1 token** dari license key

---

## 🚀 Quick Start

```typescript
import { KGiTONApiService } from '@kgiton/react-native-sdk';

// Initialize dengan API Key
const api = new KGiTONApiService({
  baseUrl: 'https://api.kgiton.com',
  apiKey: 'kgiton_your_api_key_here',
});

// Generate QRIS payment
const payment = await api.partnerPayment.generateQris({
  transactionId: 'TRX-2026-001',
  amount: 50000,
  licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
  description: 'Pembayaran Laundry',
  webhookUrl: 'https://api.partner.com/webhook/payment',
});

// Display QRIS QR code
console.log('QRIS URL:', payment.qris?.qrImageUrl);
console.log('Expires at:', payment.expiresAt);
```

---

## 💳 Generate QRIS Payment

QRIS cocok untuk pembayaran langsung di kasir:

```typescript
const generateQrisPayment = async () => {
  try {
    const payment = await api.partnerPayment.generateQris({
      transactionId: `TRX-${Date.now()}`,
      amount: 75000,
      licenseKey: licenseKey,
      description: 'Pembayaran Order #123',
      expiryMinutes: 30, // Default 30 menit
      webhookUrl: 'https://api.myapp.com/webhook/kgiton',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '08123456789',
    });
    
    console.log('✅ QRIS Generated');
    console.log('Transaction ID:', payment.transactionId);
    console.log('Amount:', payment.amount);
    console.log('QR Image URL:', payment.qris?.qrImageUrl);
    console.log('Expires at:', payment.expiresAt);
    
    // Show QR code
    setQrCodeUrl(payment.qris?.qrImageUrl);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

## 🌐 Generate Checkout Page Payment

Checkout page cocok untuk pembayaran online atau jarak jauh:

```typescript
const generateCheckoutPayment = async () => {
  try {
    const payment = await api.partnerPayment.generateCheckoutPage({
      transactionId: `TRX-${Date.now()}`,
      amount: 150000,
      licenseKey: licenseKey,
      description: 'Pembayaran Invoice #456',
      expiryMinutes: 120, // Default 2 jam
      backUrl: 'https://myapp.com/payment/complete',
      webhookUrl: 'https://api.myapp.com/webhook/kgiton',
      items: [
        {
          id: 'ITEM-001',
          name: 'Laundry Kiloan 5kg',
          price: 100000,
          quantity: 1,
        },
        {
          id: 'ITEM-002',
          name: 'Extra Parfum',
          price: 50000,
          quantity: 1,
        },
      ],
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      customerPhone: '08987654321',
    });
    
    console.log('✅ Checkout Page Generated');
    console.log('Transaction ID:', payment.transactionId);
    console.log('Payment URL:', payment.paymentUrl);
    
    // Open payment URL
    Linking.openURL(payment.paymentUrl);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

## 📨 Webhook Callback

Saat pembayaran berhasil, KGiTON akan mengirim POST request ke `webhook_url`:

### Webhook Payload

```json
{
  "event": "partner_payment.success",
  "transaction_id": "TRX-2026-001",
  "license_key": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
  "amount": 50000,
  "payment_type": "qris",
  "paid_at": "2026-01-15T10:30:00.000Z",
  "gateway_transaction_id": "647a5129-76db-483d-ae76-497ae1d310da"
}
```

### Contoh Handler (Backend)

```javascript
// Express.js webhook handler
app.post('/webhook/kgiton', (req, res) => {
  const { event, transaction_id, amount, paid_at } = req.body;
  
  if (event === 'partner_payment.success') {
    // Update order status
    updateOrderStatus(transaction_id, 'paid', paid_at);
    
    // Notify customer
    sendPaymentConfirmation(transaction_id);
  }
  
  res.status(200).json({ received: true });
});
```

---

## 📱 React Native Component

```tsx
import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Alert, Linking } from 'react-native';
import { KGiTONApiService, PartnerPaymentResponse } from '@kgiton/react-native-sdk';

interface PaymentScreenProps {
  amount: number;
  orderId: string;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ amount, orderId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [payment, setPayment] = useState<PartnerPaymentResponse | null>(null);
  
  const handleGenerateQris = async () => {
    setIsLoading(true);
    
    try {
      const result = await api.partnerPayment.generateQris({
        transactionId: orderId,
        amount: amount,
        licenseKey: await getLicenseKey(),
        webhookUrl: 'https://api.myapp.com/webhook/kgiton',
      });
      
      setPayment(result);
      
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Total: Rp {amount.toLocaleString()}</Text>
      
      {!payment ? (
        <Button
          title={isLoading ? 'Loading...' : 'Generate QRIS'}
          onPress={handleGenerateQris}
          disabled={isLoading}
        />
      ) : (
        <View style={styles.qrisContainer}>
          <Image
            source={{ uri: payment.qris?.qrImageUrl }}
            style={styles.qrCode}
          />
          <Text style={styles.instruction}>Scan QRIS untuk membayar</Text>
          <Text style={styles.expiry}>Berlaku hingga: {payment.expiresAt}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  qrisContainer: {
    alignItems: 'center',
  },
  qrCode: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    fontWeight: '500',
  },
  expiry: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
```

---

## 🔄 Check Payment Status (Polling)

Untuk pendekatan **independent tanpa webhook**, gunakan `checkStatus` untuk polling status pembayaran:

```typescript
// Check payment status
const checkPaymentStatus = async (transactionId: string) => {
  try {
    const status = await api.partnerPayment.checkStatus(transactionId);
    
    console.log('Payment Status:', status.paymentStatus);
    console.log('Amount:', status.amount);
    
    if (status.paymentStatus === 'paid') {
      console.log('✅ Payment received at:', status.paidAt);
      // Process successful payment
    } else if (status.paymentStatus === 'expired') {
      console.log('⏰ Payment expired');
      // Offer to regenerate payment
    } else if (status.paymentStatus === 'pending') {
      console.log('⏳ Still waiting for payment...');
    }
    
    return status;
  } catch (error) {
    console.error('Error checking status:', error.message);
    throw error;
  }
};
```

### Polling Pattern

```typescript
// Poll payment status every 5 seconds until terminal state
const pollPaymentStatus = async (
  transactionId: string,
  maxDurationMs: number = 300000 // 5 minutes default
): Promise<'paid' | 'expired' | 'failed' | 'timeout'> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxDurationMs) {
    try {
      const status = await api.partnerPayment.checkStatus(transactionId);
      
      if (status.paymentStatus === 'paid') {
        return 'paid';
      } else if (status.paymentStatus === 'expired') {
        return 'expired';
      } else if (status.paymentStatus === 'failed') {
        return 'failed';
      }
      
      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Polling error:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return 'timeout';
};

// Usage
const result = await pollPaymentStatus(payment.transactionId);
if (result === 'paid') {
  showSuccessScreen();
} else if (result === 'expired') {
  showExpiredScreen();
} else {
  showTimeoutScreen();
}
```

---

## ⚠️ Error Handling

| Error Code | Description | Solution |
|------------|-------------|----------|
| 401 | Invalid API key | Periksa API key |
| 402 | Insufficient token balance | Top-up token |
| 403 | License key not active | Aktifkan license key |
| 404 | License key not found | Periksa license key |
| 500 | Payment gateway error | Coba lagi nanti |

```typescript
try {
  const payment = await api.partnerPayment.generateQris({...});
} catch (error: any) {
  if (error.statusCode === 402) {
    // Token habis
    showTopupDialog();
  } else if (error.statusCode === 403) {
    // License tidak aktif
    showActivateLicenseDialog();
  } else if (error.statusCode === 404) {
    // License tidak ditemukan
    showInvalidLicenseDialog();
  } else {
    // Error lainnya
    Alert.alert('Error', error.message);
  }
}
```

---

## 📊 Types Reference

### PartnerPaymentRequest

```typescript
interface PartnerPaymentRequest {
  transactionId: string;        // Partner's unique transaction ID
  amount: number;               // Amount in IDR
  licenseKey: string;           // KGiTON license key
  paymentType?: PartnerPaymentType; // 'qris' or 'checkout_page'
  description?: string;         // Transaction description
  backUrl?: string;             // Redirect URL (checkout only)
  expiryMinutes?: number;       // Expiry time
  items?: PartnerPaymentItem[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  webhookUrl?: string;          // Callback URL
}
```

### PartnerPaymentResponse

```typescript
interface PartnerPaymentResponse {
  transactionId: string;
  paymentType: PartnerPaymentType;
  amount: number;
  gatewayProvider: string;
  gatewayTransactionId?: string;
  paymentUrl?: string;          // Checkout URL
  qris?: PartnerQrisData;       // QRIS data
  expiresAt: string;
}
```

### PartnerPaymentStatusResponse

```typescript
interface PartnerPaymentStatusResponse {
  transactionId: string;
  paymentStatus: 'pending' | 'paid' | 'expired' | 'failed';
  amount: number;
  paymentType: PartnerPaymentType;
  gatewayTransactionId?: string;
  paidAt?: string;              // Timestamp when payment was completed
  expiresAt?: string;
  webhookSent?: boolean;        // Whether webhook callback was sent
  createdAt?: string;
}
```

---

## 🔗 Related Documentation

- [Top-up & Payment](04_TOPUP_PAYMENT.md) - Top-up token balance
- [API Reference](06_API_REFERENCE.md) - Complete API reference

---

<p align="center">
  <a href="07_TROUBLESHOOTING.md">← Troubleshooting</a>
</p>
