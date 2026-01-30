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
| `getTokenUsageStats` | - | `Promise<TokenUsageStats>` | Get usage stats |
| `getLicenseTokenUsage` | `licenseKey, page?, limit?` | `Promise<LicenseTokenUsageResponse>` | Get license usage history |
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

interface TokenUsageStats {
  weeklyUsage: number;
  avgDailyUsage: number;
  estimatedDaysRemaining: number | null;
  usageHistory: TokenUsageRecord[];
}

interface TokenUsageRecord {
  date: string;
  tokensUsed: number;
}

interface LicenseTokenUsageResponse {
  licenseKey: string;
  records: LicenseTokenUsage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LicenseTokenUsage {
  id: string;
  tokensUsed: number;
  purpose?: string;
  metadata?: Record<string, any>;
  createdAt: string;
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
| `getPaymentMethods` | - | `Promise<PaymentMethodInfo[]>` | Get payment methods |
| `request` | `TopupRequest` | `Promise<TopupData>` | Create transaction |
| `getStatus` | `transactionId: string` | `Promise<TopupStatusData>` | Get transaction status (auth) |
| `checkStatusPublic` | `transactionId: string` | `Promise<TopupStatusData>` | Check status (no auth) |
| `getHistory` | - | `Promise<TopupHistoryItem[]>` | Get transaction history |
| `cancel` | `transactionId: string` | `Promise<void>` | Cancel transaction |
| `isPaid` | `transactionId: string` | `Promise<boolean>` | Check if paid |

### Types

```typescript
type PaymentMethod = 
  | 'checkout_page'
  | 'va_bri' | 'va_bni' | 'va_bca' | 'va_mandiri'
  | 'va_permata' | 'va_bsi' | 'va_cimb'
  | 'qris';

interface TopupRequest {
  tokenCount: number;
  licenseKey: string;
  paymentMethod?: PaymentMethod;
  customerPhone?: string;
}

interface PaymentMethodInfo {
  id: string;          // checkout_page, va_bri, qris, dll
  name: string;
  description?: string;
  type: 'checkout' | 'va' | 'qris';
  enabled: boolean;
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

interface TopupData {
  transactionId: string;
  licenseKey: string;
  tokensRequested: number;
  amountToPay: number;
  pricePerToken: number;
  status: string;
  paymentMethod: string;
  gatewayProvider: string;
  paymentUrl?: string;           // For checkout_page
  virtualAccount?: VirtualAccountInfo;  // For VA payments
  qris?: QRISInfo;               // For QRIS payment
  gatewayTransactionId?: string;
  expiresAt: string;
}

type TopupStatus = 'pending' | 'success' | 'paid' | 'expired' | 'failed' | 'cancelled';

interface TopupStatusData {
  transactionId: string;
  type: string;              // 'topup', 'license_purchase', 'license_rental'
  amount: number;
  status: TopupStatus;
  tokensAdded?: number;      // Only for topup
  tokensRequested?: number;  // Only for topup
  licenseKey?: string;       // Only for license transactions
  createdAt: string;
  paidAt?: string;
}

interface TopupHistoryItem {
  transactionId: string;
  licenseKey: string;
  tokenCount: number;
  amount: number;
  status: TopupStatus;
  paymentMethod: PaymentMethod;
  paidAt?: string;
  createdAt: string;
}
```

---

## LicenseTransactionService

`api.licenseTransaction` - License transaction operations.

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `getMyTransactions` | - | `Promise<LicenseTransactionData[]>` | Get user's transactions |
| `getMyLicenses` | - | `Promise<MyLicenseData[]>` | Get user's licenses |
| `initiatePurchase` | `LicenseTransactionPurchaseRequest` | `Promise<LicenseTransactionResponse>` | Initiate purchase payment |
| `initiateSubscription` | `LicenseTransactionSubscriptionRequest` | `Promise<LicenseTransactionResponse>` | Initiate subscription payment |

### Types

```typescript
type LicensePaymentMethod = 
  | 'checkout_page'
  | 'va_bri' | 'va_bni' | 'va_bca' | 'va_mandiri'
  | 'va_permata' | 'va_bsi' | 'va_cimb'
  | 'qris';

interface LicenseTransactionPurchaseRequest {
  licenseKey: string;
  paymentMethod: LicensePaymentMethod;
}

interface LicenseTransactionSubscriptionRequest {
  licenseKey: string;
  paymentMethod: LicensePaymentMethod;
}

interface LicenseTransactionData {
  id: string;
  licenseKey: string;
  type: 'license_purchase' | 'license_rental';
  status: string;
  amount: number;
  paymentMethod?: string;
  createdAt: string;
  paidAt?: string;
}

interface BillingPeriod {
  startDate: string;
  endDate: string;
  durationDays: number;
}

interface LicenseTransactionResponse {
  transactionId: string;
  licenseKey: string;
  type: string;
  amount: number;
  status: string;
  paymentMethod: string;
  paymentUrl?: string;
  virtualAccount?: VirtualAccountInfo;
  qris?: QRISInfo;
  billingPeriod?: BillingPeriod;
  expiresAt?: string;
}

interface MyLicenseData {
  licenseKey: string;
  deviceName: string;
  status: string;
  type: 'buy' | 'rent';
  expiresAt?: string;
  tokenBalance: number;
  createdAt: string;
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
