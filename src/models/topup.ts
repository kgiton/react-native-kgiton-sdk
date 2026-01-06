/**
 * Top-up Models
 */

/**
 * Top-up payment status
 */
export type TopupStatus = 'pending' | 'paid' | 'expired' | 'failed' | 'cancelled';

/**
 * Payment type
 */
export type PaymentType = 'qris' | 'checkout_page';

/**
 * Top-up request
 */
export interface TopupRequest {
  tokenCount: number;
  licenseKey: string;
  paymentType?: PaymentType;
}

/**
 * Top-up response data
 */
export interface TopupData {
  transactionId: string;
  licenseKey: string;
  tokenCount: number;
  amount: number;
  status: TopupStatus;
  paymentType: PaymentType;
  paymentUrl?: string;
  qris?: {
    qrContent: string;
    qrImageUrl: string;
  };
  expiresAt: string;
  createdAt: string;
}

/**
 * Top-up status response
 */
export interface TopupStatusData {
  transactionId: string;
  status: TopupStatus;
  tokenCount: number;
  amount: number;
  paidAt?: string;
  tokensAdded?: boolean;
}

/**
 * Top-up history item
 */
export interface TopupHistoryItem {
  transactionId: string;
  licenseKey: string;
  tokenCount: number;
  amount: number;
  status: TopupStatus;
  paymentType: PaymentType;
  paidAt?: string;
  createdAt: string;
}

// ============================================================================
// PARSERS
// ============================================================================

/**
 * Parse TopupData from API response
 */
export function parseTopupData(json: Record<string, unknown>): TopupData {
  const qrisJson = json.qris as Record<string, unknown> | undefined;
  
  return {
    transactionId: (json.transaction_id as string) ?? '',
    licenseKey: (json.license_key as string) ?? '',
    tokenCount: (json.token_count as number) ?? 0,
    amount: (json.amount as number) ?? 0,
    status: (json.status as TopupStatus) ?? 'pending',
    paymentType: (json.payment_type as PaymentType) ?? 'qris',
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
 * Parse TopupStatusData from API response
 */
export function parseTopupStatusData(json: Record<string, unknown>): TopupStatusData {
  return {
    transactionId: (json.transaction_id as string) ?? '',
    status: (json.status as TopupStatus) ?? 'pending',
    tokenCount: (json.token_count as number) ?? 0,
    amount: (json.amount as number) ?? 0,
    paidAt: json.paid_at as string | undefined,
    tokensAdded: json.tokens_added as boolean | undefined,
  };
}

/**
 * Parse TopupHistoryItem from API response
 */
export function parseTopupHistoryItem(json: Record<string, unknown>): TopupHistoryItem {
  return {
    transactionId: (json.transaction_id as string) ?? '',
    licenseKey: (json.license_key as string) ?? '',
    tokenCount: (json.token_count as number) ?? 0,
    amount: (json.amount as number) ?? 0,
    status: (json.status as TopupStatus) ?? 'pending',
    paymentType: (json.payment_type as PaymentType) ?? 'qris',
    paidAt: json.paid_at as string | undefined,
    createdAt: (json.created_at as string) ?? new Date().toISOString(),
  };
}
