/**
 * Partner Payment Models
 */

/**
 * Partner payment type
 */
export type PartnerPaymentType = 'qris' | 'checkout_page';

/**
 * Partner payment item
 */
export interface PartnerPaymentItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Partner payment request
 */
export interface PartnerPaymentRequest {
  /** Partner's unique transaction ID */
  transactionId: string;
  /** Amount to charge in IDR */
  amount: number;
  /** KGiTON license key */
  licenseKey: string;
  /** Payment method type (qris or checkout_page) */
  paymentType?: PartnerPaymentType;
  /** Transaction description */
  description?: string;
  /** URL to redirect after payment (for checkout_page) */
  backUrl?: string;
  /** Expiry in minutes (default 30 for QRIS, 120 for checkout_page) */
  expiryMinutes?: number;
  /** List of items */
  items?: PartnerPaymentItem[];
  /** Customer name */
  customerName?: string;
  /** Customer email */
  customerEmail?: string;
  /** Customer phone */
  customerPhone?: string;
  /** URL to receive payment status callback */
  webhookUrl?: string;
}

/**
 * Partner QRIS data
 */
export interface PartnerQrisData {
  qrContent?: string;
  qrImageUrl: string;
}

/**
 * Partner payment response
 */
export interface PartnerPaymentResponse {
  transactionId: string;
  paymentType: PartnerPaymentType;
  amount: number;
  gatewayProvider: string;
  gatewayTransactionId?: string;
  paymentUrl?: string;
  qris?: PartnerQrisData;
  expiresAt: string;
}

// ============================================================================
// PARSERS
// ============================================================================

/**
 * Parse PartnerPaymentResponse from API response
 */
export function parsePartnerPaymentResponse(json: Record<string, unknown>): PartnerPaymentResponse {
  const qrisJson = json.qris as Record<string, unknown> | undefined;
  
  return {
    transactionId: (json.transaction_id as string) ?? '',
    paymentType: (json.payment_type as PartnerPaymentType) ?? 'checkout_page',
    amount: (json.amount as number) ?? 0,
    gatewayProvider: (json.gateway_provider as string) ?? '',
    gatewayTransactionId: json.gateway_transaction_id as string | undefined,
    paymentUrl: json.payment_url as string | undefined,
    qris: qrisJson
      ? {
          qrContent: qrisJson.qr_content as string | undefined,
          qrImageUrl: (qrisJson.qr_image_url as string) ?? '',
        }
      : undefined,
    expiresAt: (json.expires_at as string) ?? '',
  };
}
