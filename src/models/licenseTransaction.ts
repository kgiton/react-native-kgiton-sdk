/**
 * License Transaction Models
 */

/**
 * Transaction type
 */
export type LicenseTransactionType = 'buy' | 'rent';

/**
 * Transaction status
 */
export type LicenseTransactionStatus = 'pending' | 'paid' | 'expired' | 'failed' | 'cancelled';

/**
 * License transaction request
 */
export interface LicenseTransactionRequest {
  licenseKey: string;
  transactionType: LicenseTransactionType;
  paymentType?: 'qris' | 'checkout_page';
  subscriptionMonths?: number; // For rent type
}

/**
 * License transaction response
 */
export interface LicenseTransactionData {
  transactionId: string;
  licenseKey: string;
  transactionType: LicenseTransactionType;
  amount: number;
  status: LicenseTransactionStatus;
  paymentUrl?: string;
  qris?: {
    qrContent: string;
    qrImageUrl: string;
  };
  expiresAt: string;
  createdAt: string;
}

/**
 * License transaction status
 */
export interface LicenseTransactionStatusData {
  transactionId: string;
  status: LicenseTransactionStatus;
  transactionType: LicenseTransactionType;
  amount: number;
  paidAt?: string;
}

/**
 * License transaction history item
 */
export interface LicenseTransactionHistoryItem {
  transactionId: string;
  licenseKey: string;
  transactionType: LicenseTransactionType;
  amount: number;
  status: LicenseTransactionStatus;
  paidAt?: string;
  createdAt: string;
}

// ============================================================================
// PARSERS
// ============================================================================

/**
 * Parse LicenseTransactionData from API response
 */
export function parseLicenseTransactionData(json: Record<string, unknown>): LicenseTransactionData {
  const qrisJson = json.qris as Record<string, unknown> | undefined;
  
  return {
    transactionId: (json.transaction_id as string) ?? '',
    licenseKey: (json.license_key as string) ?? '',
    transactionType: (json.transaction_type as LicenseTransactionType) ?? 'buy',
    amount: (json.amount as number) ?? 0,
    status: (json.status as LicenseTransactionStatus) ?? 'pending',
    paymentUrl: json.payment_url as string | undefined,
    qris: qrisJson
      ? {
          qrContent: (qrisJson.qr_content as string) ?? '',
          qrImageUrl: (qrisJson.qr_image_url as string) ?? '',
        }
      : undefined,
    expiresAt: (json.expires_at as string) ?? '',
    createdAt: (json.created_at as string) ?? new Date().toISOString(),
  };
}

/**
 * Parse LicenseTransactionStatusData from API response
 */
export function parseLicenseTransactionStatusData(json: Record<string, unknown>): LicenseTransactionStatusData {
  return {
    transactionId: (json.transaction_id as string) ?? '',
    status: (json.status as LicenseTransactionStatus) ?? 'pending',
    transactionType: (json.transaction_type as LicenseTransactionType) ?? 'buy',
    amount: (json.amount as number) ?? 0,
    paidAt: json.paid_at as string | undefined,
  };
}

/**
 * Parse LicenseTransactionHistoryItem from API response
 */
export function parseLicenseTransactionHistoryItem(json: Record<string, unknown>): LicenseTransactionHistoryItem {
  return {
    transactionId: (json.transaction_id as string) ?? '',
    licenseKey: (json.license_key as string) ?? '',
    transactionType: (json.transaction_type as LicenseTransactionType) ?? 'buy',
    amount: (json.amount as number) ?? 0,
    status: (json.status as LicenseTransactionStatus) ?? 'pending',
    paidAt: json.paid_at as string | undefined,
    createdAt: (json.created_at as string) ?? new Date().toISOString(),
  };
}
