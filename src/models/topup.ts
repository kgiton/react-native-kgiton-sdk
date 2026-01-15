/**
 * Top-up Models
 */

/**
 * Top-up payment status
 */
export type TopupStatus = 'pending' | 'success' | 'paid' | 'expired' | 'failed' | 'cancelled';

/**
 * Payment method
 */
export type PaymentMethod = 
  | 'checkout_page'
  | 'va_bri'
  | 'va_bni'
  | 'va_bca'
  | 'va_mandiri'
  | 'va_permata'
  | 'va_bsi'
  | 'va_cimb'
  | 'qris';

/**
 * Top-up request
 */
export interface TopupRequest {
  tokenCount: number;
  licenseKey: string;
  paymentMethod?: PaymentMethod;
  customerPhone?: string;
}

/**
 * Virtual Account info
 */
export interface VirtualAccountInfo {
  number: string;
  name: string;
  bank: string;
}

/**
 * QRIS info
 */
export interface QRISInfo {
  qrString: string | null;
  qrImageUrl: string;
}

/**
 * Top-up response data
 */
export interface TopupData {
  transactionId: string;
  licenseKey: string;
  tokensRequested: number;
  amountToPay: number;
  pricePerToken: number;
  status: string;
  paymentMethod: string;
  gatewayProvider: string;
  paymentUrl?: string;
  virtualAccount?: VirtualAccountInfo;
  qris?: QRISInfo;
  gatewayTransactionId?: string;
  expiresAt: string;
}

/**
 * Top-up status response
 */
export interface TopupStatusData {
  transactionId: string;
  type: string;
  amount: number;
  status: TopupStatus;
  tokensAdded?: number;
  tokensRequested?: number;
  licenseKey?: string;
  createdAt: string;
  paidAt?: string;
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
  paymentMethod: PaymentMethod;
  paidAt?: string;
  createdAt: string;
}

/**
 * Payment method info
 */
export interface PaymentMethodInfo {
  id: string;
  name: string;
  description?: string;
  type: 'checkout' | 'va' | 'qris';
  enabled: boolean;
}

// ============================================================================
// PARSERS
// ============================================================================

/**
 * Parse TopupData from API response
 */
export function parseTopupData(json: Record<string, unknown>): TopupData {
  const vaJson = json.virtual_account as Record<string, unknown> | undefined;
  const qrisJson = json.qris as Record<string, unknown> | undefined;
  
  return {
    transactionId: (json.transaction_id as string) ?? '',
    licenseKey: (json.license_key as string) ?? '',
    tokensRequested: (json.tokens_requested as number) ?? 0,
    amountToPay: (json.amount_to_pay as number) ?? 0,
    pricePerToken: (json.price_per_token as number) ?? 0,
    status: (json.status as string) ?? 'PENDING',
    paymentMethod: (json.payment_method as string) ?? 'checkout_page',
    gatewayProvider: (json.gateway_provider as string) ?? '',
    paymentUrl: json.payment_url as string | undefined,
    virtualAccount: vaJson
      ? {
          number: (vaJson.number as string) ?? '',
          name: (vaJson.name as string) ?? '',
          bank: (vaJson.bank as string) ?? '',
        }
      : undefined,
    qris: qrisJson
      ? {
          qrString: (qrisJson.qr_string as string) ?? null,
          qrImageUrl: (qrisJson.qr_image_url as string) ?? '',
        }
      : undefined,
    gatewayTransactionId: json.gateway_transaction_id as string | undefined,
    expiresAt: (json.expires_at as string) ?? '',
  };
}

/**
 * Parse TopupStatusData from API response
 */
export function parseTopupStatusData(json: Record<string, unknown>): TopupStatusData {
  return {
    transactionId: (json.transaction_id as string) ?? '',
    type: (json.type as string) ?? 'topup',
    amount: (json.amount as number) ?? 0,
    status: (json.status as TopupStatus) ?? 'pending',
    tokensAdded: json.tokens_added as number | undefined,
    tokensRequested: json.tokens_requested as number | undefined,
    licenseKey: json.license_key as string | undefined,
    createdAt: (json.created_at as string) ?? new Date().toISOString(),
    paidAt: json.paid_at as string | undefined,
  };
}

/**
 * Parse TopupHistoryItem from API response
 */
export function parseTopupHistoryItem(json: Record<string, unknown>): TopupHistoryItem {
  return {
    transactionId: (json.id as string) ?? (json.transaction_id as string) ?? '',
    licenseKey: (json.license_key as string) ?? '',
    tokenCount: (json.tokens_added as number) ?? 0,
    amount: (json.amount as number) ?? 0,
    status: (json.status as TopupStatus) ?? 'pending',
    paymentMethod: (json.payment_method as PaymentMethod) ?? 'checkout_page',
    paidAt: json.paid_at as string | undefined,
    createdAt: (json.created_at as string) ?? new Date().toISOString(),
  };
}

/**
 * Parse PaymentMethodInfo from API response
 */
export function parsePaymentMethodInfo(json: Record<string, unknown>): PaymentMethodInfo {
  return {
    id: (json.id as string) ?? '',
    name: (json.name as string) ?? '',
    description: json.description as string | undefined,
    type: (json.type as 'checkout' | 'va' | 'qris') ?? 'checkout',
    enabled: (json.enabled as boolean) ?? true,
  };
}

/**
 * Sync transaction status response
 */
export interface SyncTransactionResponse {
  transactionId: string;
  status: string;
  previousStatus?: string;
  paymentMethod: string;
  updated: boolean;
  gatewayStatus?: string;
}

/**
 * Parse SyncTransactionResponse from API response
 */
export function parseSyncTransactionResponse(json: Record<string, unknown>): SyncTransactionResponse {
  return {
    transactionId: (json.transaction_id as string) ?? '',
    status: (json.status as string) ?? '',
    previousStatus: json.previous_status as string | undefined,
    paymentMethod: (json.payment_method as string) ?? '',
    updated: (json.updated as boolean) ?? false,
    gatewayStatus: json.gateway_status as string | undefined,
  };
}
