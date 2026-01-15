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
export type LicenseTransactionStatus = 'pending' | 'paid' | 'success' | 'expired' | 'failed' | 'cancelled';

/**
 * Payment method for license transactions
 */
export type LicensePaymentMethod =
  | 'checkout_page'
  | 'va_bri'
  | 'va_bni'
  | 'va_bca'
  | 'va_mandiri'
  | 'va_permata'
  | 'va_bsi'
  | 'va_cimb'
  | 'qris'
  | 'cash'
  | 'manual';

/**
 * License transaction request (purchase)
 */
export interface LicenseTransactionPurchaseRequest {
  licenseKey: string;
  paymentMethod?: LicensePaymentMethod;
  customerPhone?: string;
}

/**
 * License transaction request (subscription)
 */
export interface LicenseTransactionSubscriptionRequest {
  licenseKey: string;
  paymentMethod?: LicensePaymentMethod;
  customerPhone?: string;
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
  paymentMethod?: string;
  paymentUrl?: string;
  vaNumber?: string;
  qris?: {
    qrContent: string | null;
    qrImageUrl: string;
  };
  billingPeriod?: {
    start: string;
    end: string;
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
  paymentMethod?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
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
  const billingPeriod = json.billing_period as Record<string, unknown> | undefined;
  
  return {
    transactionId: (json.transaction_id as string) ?? '',
    licenseKey: (json.license_key as string) ?? '',
    transactionType: (json.transaction_type as LicenseTransactionType) ?? 'buy',
    amount: (json.amount as number) ?? 0,
    status: (json.status as LicenseTransactionStatus) ?? 'pending',
    paymentMethod: json.payment_method as string | undefined,
    paymentUrl: json.payment_url as string | undefined,
    vaNumber: json.va_number as string | undefined,
    qris: qrisJson
      ? {
          qrContent: (qrisJson.qr_content as string) ?? null,
          qrImageUrl: (qrisJson.qr_image_url as string) ?? '',
        }
      : undefined,
    billingPeriod: billingPeriod
      ? {
          start: (billingPeriod.start as string) ?? '',
          end: (billingPeriod.end as string) ?? '',
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
    transactionId: (json.id as string) ?? (json.transaction_id as string) ?? '',
    licenseKey: (json.license_key as string) ?? '',
    transactionType: (json.transaction_type as LicenseTransactionType) ?? 'buy',
    amount: (json.amount as number) ?? 0,
    status: (json.status as LicenseTransactionStatus) ?? 'pending',
    paymentMethod: json.payment_method as string | undefined,
    billingPeriodStart: json.billing_period_start as string | undefined,
    billingPeriodEnd: json.billing_period_end as string | undefined,
    paidAt: json.paid_at as string | undefined,
    createdAt: (json.created_at as string) ?? new Date().toISOString(),
  };
}
