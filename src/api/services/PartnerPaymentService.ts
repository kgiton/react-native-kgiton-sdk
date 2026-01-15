/**
 * Partner Payment Service
 * 
 * Allows partners to generate payments for their own transactions
 * using KGiTON's payment gateway.
 */

import { KGiTONApiClient } from '../KGiTONApiClient';
import { API_ENDPOINTS } from '../../constants/api';
import { KGiTONApiException } from '../../exceptions';
import {
  PartnerPaymentRequest,
  PartnerPaymentResponse,
  PartnerPaymentItem,
  parsePartnerPaymentResponse,
} from '../../models/partnerPayment';

/**
 * Partner Payment service for KGiTON API
 * 
 * This service requires API key authentication (x-api-key header).
 * 
 * Payment Types:
 * - QRIS: Generate QRIS QR code for payment (expires in 30 minutes by default)
 * - Checkout Page: Generate URL to Winpay checkout page (expires in 120 minutes by default)
 */
export class PartnerPaymentService {
  constructor(private client: KGiTONApiClient) {}

  /**
   * Generate payment (QRIS or Checkout Page)
   * 
   * Creates a payment request for partner transactions using KGiTON's
   * payment gateway. This will deduct 1 token from the license key balance.
   */
  async generate(request: PartnerPaymentRequest): Promise<PartnerPaymentResponse> {
    if (!request.transactionId || request.amount <= 0 || !request.licenseKey) {
      throw new KGiTONApiException('Invalid payment request: transactionId, amount > 0, and licenseKey are required');
    }

    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.PARTNER_PAYMENT.GENERATE,
      {
        transaction_id: request.transactionId,
        amount: request.amount,
        license_key: request.licenseKey,
        payment_type: request.paymentType ?? 'checkout_page',
        description: request.description,
        back_url: request.backUrl,
        expiry_minutes: request.expiryMinutes,
        items: request.items?.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        customer_name: request.customerName,
        customer_email: request.customerEmail,
        customer_phone: request.customerPhone,
        webhook_url: request.webhookUrl,
      },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to generate payment: ${response.message}`);
    }

    return parsePartnerPaymentResponse(response.data);
  }

  /**
   * Generate QRIS payment
   * 
   * Shorthand for generating a QRIS payment.
   */
  async generateQris(options: {
    transactionId: string;
    amount: number;
    licenseKey: string;
    description?: string;
    expiryMinutes?: number;
    webhookUrl?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<PartnerPaymentResponse> {
    return this.generate({
      transactionId: options.transactionId,
      amount: options.amount,
      licenseKey: options.licenseKey,
      paymentType: 'qris',
      description: options.description,
      expiryMinutes: options.expiryMinutes ?? 30,
      webhookUrl: options.webhookUrl,
      customerName: options.customerName,
      customerEmail: options.customerEmail,
      customerPhone: options.customerPhone,
    });
  }

  /**
   * Generate Checkout Page payment
   * 
   * Shorthand for generating a checkout page payment.
   */
  async generateCheckoutPage(options: {
    transactionId: string;
    amount: number;
    licenseKey: string;
    description?: string;
    backUrl?: string;
    expiryMinutes?: number;
    webhookUrl?: string;
    items?: PartnerPaymentItem[];
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<PartnerPaymentResponse> {
    return this.generate({
      transactionId: options.transactionId,
      amount: options.amount,
      licenseKey: options.licenseKey,
      paymentType: 'checkout_page',
      description: options.description,
      backUrl: options.backUrl,
      expiryMinutes: options.expiryMinutes ?? 120,
      webhookUrl: options.webhookUrl,
      items: options.items,
      customerName: options.customerName,
      customerEmail: options.customerEmail,
      customerPhone: options.customerPhone,
    });
  }
}
