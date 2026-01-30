/**
 * API Configuration Constants
 */

export const API_CONFIG = {
  /** Default base URL (can be overridden) */
  DEFAULT_BASE_URL: 'https://api.kgiton.com',
  
  /** API version prefix */
  API_VERSION: '/api',
  
  /** Request timeout in milliseconds */
  REQUEST_TIMEOUT: 30000,
  
  /** Maximum retry attempts */
  MAX_RETRIES: 3,
  
  /** Base delay for retry (exponential backoff) */
  RETRY_DELAY: 1000,
};

/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  BASE_URL: '@kgiton/base_url',
  ACCESS_TOKEN: '@kgiton/access_token',
  REFRESH_TOKEN: '@kgiton/refresh_token',
  API_KEY: '@kgiton/api_key',
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verify-email',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // User
  USER: {
    PROFILE: '/user/profile',
    TOKEN_BALANCE: '/user/token-balance',
    USE_TOKEN: (licenseKey: string) => `/user/license-keys/${licenseKey}/use-token`,
    ASSIGN_LICENSE: '/user/assign-license',
    REGENERATE_API_KEY: '/user/regenerate-api-key',
    REVOKE_API_KEY: '/user/revoke-api-key',
  },
  
  // License
  LICENSE: {
    VALIDATE: (licenseKey: string) => `/license/validate/${licenseKey}`,
  },
  
  // Top-up
  TOPUP: {
    PAYMENT_METHODS: '/topup/payment-methods',
    REQUEST: '/topup/request',
    CHECK_PUBLIC: (transactionId: string) => `/topup/check/${transactionId}`,
    STATUS: (transactionId: string) => `/topup/status/${transactionId}`,
    HISTORY: '/topup/history',
    CANCEL: (transactionId: string) => `/topup/cancel/${transactionId}`,
    SYNC: (transactionId: string) => `/topup/sync/${transactionId}`,
    BONUS_TIERS: '/topup/bonus-tiers',
  },
  
  // Partner Payment
  PARTNER_PAYMENT: {
    GENERATE: '/partner/payment/generate',
  },
  
  // License Transaction
  LICENSE_TRANSACTION: {
    MY: '/license-transactions/my',
    MY_LICENSES: '/license-transactions/my-licenses',
    PURCHASE: '/license-transactions/purchase',
    SUBSCRIPTION: '/license-transactions/subscription',
    STATUS: (transactionId: string) => `/license-transactions/status/${transactionId}`,
  },
};
