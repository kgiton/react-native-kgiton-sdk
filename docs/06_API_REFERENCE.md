# 📚 API Reference

Referensi lengkap semua API yang tersedia di @kgiton/react-native-sdk.

---

## 📋 Table of Contents

- [KGiTONApiService](#kgitonapiservice)
- [AuthService](#authservice)
- [UserService](#userservice)
- [LicenseService](#licenseservice)
- [TopupService](#topupservice)
- [LicenseTransactionService](#licensetransactionservice)
- [KGiTONBleService](#kgitonbleservice)
- [Types & Interfaces](#types--interfaces)
- [Exceptions](#exceptions)

---

## KGiTONApiService

Main service facade untuk semua API operations.

### Constructor

```typescript
const api = new KGiTONApiService(config?: KGiTONApiClientConfig);

interface KGiTONApiClientConfig {
  baseUrl?: string;      // API base URL (default: production URL)
  timeout?: number;      // Request timeout in ms (default: 30000)
  debug?: boolean;       // Enable debug logging (default: false)
  maxRetries?: number;   // Max retry attempts (default: 3)
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `auth` | `AuthService` | Authentication operations |
| `user` | `UserService` | User operations |
| `license` | `LicenseService` | License operations |
| `topup` | `TopupService` | Top-up operations |
| `licenseTransaction` | `LicenseTransactionService` | Transaction operations |

### Methods

| Method | Return | Description |
|--------|--------|-------------|
| `setBaseUrl(url)` | `void` | Set API base URL |
| `setAccessToken(token)` | `void` | Set access token manually |
| `setApiKey(key)` | `void` | Set API key |
| `clearCredentials()` | `void` | Clear all credentials |
| `saveConfiguration()` | `Promise<void>` | Save config to storage |

---

## AuthService

`api.auth` - Authentication operations.

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `register` | `RegisterParams` | `Promise<AuthResponse>` | Register new user |
| `login` | `LoginParams` | `Promise<AuthResponse>` | Login user |
| `logout` | - | `Promise<void>` | Logout user |
| `refreshToken` | - | `Promise<AuthResponse>` | Refresh access token |
| `requestPasswordReset` | `{ email: string }` | `Promise<void>` | Request password reset |
| `resetPassword` | `ResetPasswordParams` | `Promise<void>` | Reset password |
| `verifyEmail` | `{ token: string }` | `Promise<void>` | Verify email |
| `resendVerification` | `{ email: string }` | `Promise<void>` | Resend verification email |

### Types

```typescript
interface RegisterParams {
  email: string;
  password: string;
  confirmPassword: string;
  licenseKey: string;
}

interface LoginParams {
  email: string;
  password: string;
}

interface ResetPasswordParams {
  token: string;
  password: string;
  confirmPassword: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  isVerified: boolean;
  createdAt: string;
}
```

---

## UserService

`api.user` - User operations.

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `getProfile` | - | `Promise<UserProfile>` | Get user profile |
| `updateProfile` | `UpdateProfileParams` | `Promise<UserProfile>` | Update profile |
| `changePassword` | `ChangePasswordParams` | `Promise<void>` | Change password |
| `getAssignedLicense` | - | `Promise<License>` | Get assigned license |
| `useToken` | `licenseKey: string` | `Promise<UseTokenResult>` | Use 1 token |
| `getApiKey` | - | `Promise<string>` | Get API key |
| `regenerateApiKey` | - | `Promise<string>` | Regenerate API key |

### Types

```typescript
interface UserProfile {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  tokenBalance: number;
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfileParams {
  name?: string;
  phone?: string;
}

interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UseTokenResult {
  success: boolean;
  remainingBalance: number;
  usedAt: string;
}
```

---

## LicenseService

`api.license` - License operations.

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `validate` | `licenseKey: string` | `Promise<LicenseValidation>` | Validate license |
| `getInfo` | `licenseKey: string` | `Promise<License>` | Get license info |

### Types

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

interface LicenseValidation {
  isValid: boolean;
  isAssigned: boolean;
  error?: string;
}
```

---

## TopupService

`api.topup` - Top-up operations.

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `getPackages` | - | `Promise<TopupPackage[]>` | Get available packages |
| `getPaymentMethods` | - | `Promise<PaymentMethod[]>` | Get payment methods |
| `create` | `CreateTopupParams` | `Promise<TopupTransaction>` | Create transaction |
| `getStatus` | `transactionId: string` | `Promise<TopupTransaction>` | Get transaction status |
| `getHistory` | `GetHistoryParams` | `Promise<PaginatedResponse>` | Get transaction history |
| `cancel` | `transactionId: string` | `Promise<void>` | Cancel transaction |

### Types

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

interface CreateTopupParams {
  licenseKey: string;
  tokenAmount: number;
  paymentMethod: string;
  paymentChannel: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

interface TopupTransaction {
  id: string;
  licenseKey: string;
  tokenAmount: number;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'failed' | 'cancelled';
  paymentMethod: string;
  paymentChannel: string;
  paymentUrl?: string;
  vaNumber?: string;
  qrCode?: string;
  qrString?: string;
  expiresAt: string;
  paidAt?: string;
  createdAt: string;
}

interface GetHistoryParams {
  page?: number;
  limit?: number;
  status?: string;
}
```

---

## LicenseTransactionService

`api.licenseTransaction` - License transaction operations.

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `getAll` | `GetAllParams` | `Promise<PaginatedResponse>` | Get all transactions |
| `getById` | `transactionId: string` | `Promise<LicenseTransaction>` | Get transaction by ID |
| `getSummary` | - | `Promise<TransactionSummary>` | Get summary |

### Types

```typescript
interface LicenseTransaction {
  id: string;
  licenseKey: string;
  type: 'purchase' | 'subscription' | 'topup' | 'usage';
  amount: number;
  tokenAmount: number;
  status: string;
  createdAt: string;
}

interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  totalTokens: number;
}
```

---

## KGiTONBleService

BLE service for scale connection.

### Constructor

```typescript
const ble = new KGiTONBleService(config?: KGiTONBleConfig);

interface KGiTONBleConfig {
  autoReconnect?: boolean;  // Auto reconnect on disconnect (default: true)
  debug?: boolean;          // Enable debug logging (default: false)
}
```

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `initialize` | - | `Promise<void>` | Initialize BLE |
| `startScan` | `callback: DeviceCallback` | `void` | Start scanning |
| `stopScan` | - | `void` | Stop scanning |
| `connect` | `deviceId: string` | `Promise<void>` | Connect to device |
| `disconnect` | - | `Promise<void>` | Disconnect |
| `authenticate` | `licenseKey: string` | `Promise<void>` | Authenticate |
| `addStateListener` | `callback: StateCallback` | `Subscription` | Listen to state |
| `addWeightListener` | `callback: WeightCallback` | `Subscription` | Listen to weight |
| `sendBuzzerCommand` | `command: BuzzerCommand` | `Promise<void>` | Control buzzer |
| `sendTareCommand` | - | `Promise<void>` | Tare scale |
| `getConnectionState` | - | `ConnectionState` | Get current state |
| `destroy` | - | `void` | Cleanup resources |

### Types

```typescript
enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  SCANNING = 'SCANNING',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  AUTHENTICATED = 'AUTHENTICATED',
  ERROR = 'ERROR',
}

interface ScaleDevice {
  id: string;
  name: string;
  rssi?: number;
  isConnectable: boolean;
}

interface WeightData {
  value: number;
  unit: 'kg' | 'g' | 'lb' | 'oz';
  isStable: boolean;
  timestamp: number;
}

type BuzzerCommand = 'BEEP' | 'BUZZ' | 'LONG' | 'OFF';

type DeviceCallback = (device: ScaleDevice) => void;
type StateCallback = (state: ConnectionState) => void;
type WeightCallback = (data: WeightData) => void;

interface Subscription {
  remove: () => void;
}
```

---

## Types & Interfaces

### Paginated Response

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### API Response

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
```

---

## Exceptions

### Exception Classes

| Class | HTTP Status | Description |
|-------|-------------|-------------|
| `KGiTONApiException` | Various | Base exception |
| `KGiTONAuthenticationException` | 401 | Invalid credentials |
| `KGiTONAuthorizationException` | 403 | Not authorized |
| `KGiTONValidationException` | 400 | Validation failed |
| `KGiTONNotFoundException` | 404 | Resource not found |
| `KGiTONConflictException` | 409 | Conflict (duplicate) |
| `KGiTONRateLimitException` | 429 | Rate limit exceeded |
| `KGiTONServerException` | 500 | Server error |
| `KGiTONNetworkException` | - | Network error |

### Exception Properties

```typescript
interface KGiTONApiException extends Error {
  message: string;
  code: string;
  statusCode: number;
  errors?: Record<string, string[]>;  // For validation errors
}
```

### BLE Exceptions

| Class | Description |
|-------|-------------|
| `KGiTONBleNotAvailableException` | BLE not supported/enabled |
| `KGiTONBlePermissionException` | Permission denied |
| `KGiTONBleConnectionException` | Connection failed |
| `KGiTONBleAuthenticationException` | License authentication failed |

---

<p align="center">
  <a href="05_BLE_INTEGRATION.md">← BLE Integration</a> •
  <a href="07_TROUBLESHOOTING.md">Troubleshooting →</a>
</p>
