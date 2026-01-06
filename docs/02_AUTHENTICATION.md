# 🔐 Authentication

Panduan lengkap untuk autentikasi menggunakan @kgiton/react-native-sdk.

---

## 📋 Overview

KGiTON menggunakan JWT (JSON Web Token) untuk autentikasi:

- **Access Token**: Token utama untuk API calls (expired: 24 jam)
- **Refresh Token**: Untuk mendapatkan access token baru (expired: 7 hari)

---

## 🚀 Quick Start

```typescript
import { KGiTONApiService } from '@kgiton/react-native-sdk';

const api = new KGiTONApiService({
  baseUrl: 'https://api.kgiton.com',
});

// Login
const authData = await api.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

console.log('Access Token:', authData.accessToken);
console.log('User:', authData.user);
```

---

## 📖 API Reference

### Register

Mendaftarkan user baru dengan license key.

```typescript
const authData = await api.auth.register({
  email: 'user@example.com',
  password: 'securePassword123',
  confirmPassword: 'securePassword123',
  licenseKey: 'KGITON-2026-XXXXX-00001',  // Required
});

// Response
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin' | 'super_admin';
    isVerified: boolean;
    createdAt: string;
  };
}
```

**Validation Rules:**
- `email`: Valid email format
- `password`: Minimum 8 characters
- `confirmPassword`: Must match password
- `licenseKey`: Must be valid and unassigned

---

### Login

Login dengan email dan password.

```typescript
const authData = await api.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

// Token akan tersimpan otomatis di AsyncStorage
// dan akan digunakan untuk semua request berikutnya
```

---

### Logout

Logout dan hapus semua credentials.

```typescript
await api.auth.logout();

// Semua tokens akan dihapus dari storage
// User perlu login ulang untuk mengakses API
```

---

### Refresh Token

Refresh access token menggunakan refresh token.

```typescript
const newAuthData = await api.auth.refreshToken();

// Access token baru akan tersimpan otomatis
console.log('New access token:', newAuthData.accessToken);
```

---

### Request Password Reset

Kirim email reset password.

```typescript
await api.auth.requestPasswordReset({
  email: 'user@example.com',
});

// Email akan dikirim ke alamat tersebut dengan link reset
```

---

### Reset Password

Reset password dengan token dari email.

```typescript
await api.auth.resetPassword({
  token: 'RESET_TOKEN_FROM_EMAIL',
  password: 'newSecurePassword123',
  confirmPassword: 'newSecurePassword123',
});
```

---

### Verify Email

Verifikasi email dengan token.

```typescript
await api.auth.verifyEmail({
  token: 'VERIFICATION_TOKEN',
});
```

---

### Resend Verification Email

Kirim ulang email verifikasi.

```typescript
await api.auth.resendVerification({
  email: 'user@example.com',
});
```

---

## 🔄 Token Management

### Check Authentication Status

```typescript
// Check if user is authenticated
const isAuthenticated = await api.isAuthenticated();

if (isAuthenticated) {
  // User is logged in
} else {
  // Redirect to login
}
```

### Get Current Token

```typescript
// Get current access token (if any)
const token = await api.getAccessToken();
```

### Manual Token Setting

```typescript
// Set token manually (useful for SSO or external auth)
api.setAccessToken('MANUAL_ACCESS_TOKEN');

// Clear all credentials
api.clearCredentials();
```

---

## 🛡️ Error Handling

```typescript
import { 
  KGiTONAuthenticationException,
  KGiTONValidationException,
} from '@kgiton/react-native-sdk';

try {
  await api.auth.login({ email, password });
} catch (error) {
  if (error instanceof KGiTONAuthenticationException) {
    // Invalid credentials (401)
    Alert.alert('Error', 'Email atau password salah');
  } else if (error instanceof KGiTONValidationException) {
    // Validation errors (400)
    const errors = error.errors;
    // errors = { email: ['Email is required'], password: ['Password too short'] }
    Alert.alert('Validation Error', Object.values(errors).flat().join('\n'));
  } else {
    // Other errors
    Alert.alert('Error', error.message);
  }
}
```

---

## 📱 React Component Example

```tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { KGiTONApiService, KGiTONAuthenticationException } from '@kgiton/react-native-sdk';

const api = new KGiTONApiService({ baseUrl: 'https://api.kgiton.com' });

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    setLoading(true);
    try {
      const authData = await api.auth.login({ email, password });
      
      // Login successful
      console.log('Logged in as:', authData.user.email);
      navigation.replace('Home');
      
    } catch (error) {
      if (error instanceof KGiTONAuthenticationException) {
        Alert.alert('Login Gagal', 'Email atau password salah');
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? 'Loading...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { 
    height: 50, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
});
```

---

## 🔐 Security Best Practices

1. **Jangan simpan password** di state atau storage
2. **Gunakan HTTPS** untuk semua API calls
3. **Handle token refresh** otomatis (SDK sudah handle)
4. **Logout saat user tidak aktif** untuk keamanan
5. **Gunakan biometric auth** untuk login cepat (opsional)

---

<p align="center">
  <a href="01_GETTING_STARTED.md">← Getting Started</a> •
  <a href="03_LICENSE_TOKEN.md">License & Token →</a>
</p>
