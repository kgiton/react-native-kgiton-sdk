/**
 * Top-up Service
 */

import { KGiTONApiClient } from '../KGiTONApiClient';
import { API_ENDPOINTS } from '../../constants/api';
import { KGiTONApiException } from '../../exceptions';
import {
  TopupRequest,
  TopupData,
  TopupStatusData,
  TopupHistoryItem,
  PaymentMethodInfo,
  SyncTransactionResponse,
  BonusTier,
  parseTopupData,
  parseTopupStatusData,
  parseTopupHistoryItem,
  parsePaymentMethodInfo,
  parseSyncTransactionResponse,
  parseBonusTier,
} from '../../models/topup';

/**
 * Top-up service for KGiTON API
 */
export class TopupService {
  constructor(private client: KGiTONApiClient) {}

  /**
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethodInfo[]> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.TOPUP.PAYMENT_METHODS,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to get payment methods: ${response.message}`);
    }

    const methods = (response.data as unknown as Array<Record<string, unknown>>) ?? [];
    return methods.map(parsePaymentMethodInfo);
  }

  /**
   * Request a token top-up
   */
  async request(request: TopupRequest): Promise<TopupData> {
    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.TOPUP.REQUEST,
      {
        token_count: request.tokenCount,
        license_key: request.licenseKey,
        payment_method: request.paymentMethod ?? 'checkout_page',
        customer_phone: request.customerPhone,
      },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to request top-up: ${response.message}`);
    }

    return parseTopupData(response.data);
  }

  /**
   * Check top-up status (public endpoint, no auth required)
   */
  async checkStatusPublic(transactionId: string): Promise<TopupStatusData> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.TOPUP.CHECK_PUBLIC(transactionId),
      { requiresAuth: false }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to check top-up status: ${response.message}`);
    }

    return parseTopupStatusData(response.data);
  }

  /**
   * Check top-up status (authenticated)
   */
  async getStatus(transactionId: string): Promise<TopupStatusData> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.TOPUP.STATUS(transactionId),
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to get top-up status: ${response.message}`);
    }

    return parseTopupStatusData(response.data);
  }

  /**
   * Get top-up history
   */
  async getHistory(): Promise<TopupHistoryItem[]> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.TOPUP.HISTORY,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to get top-up history: ${response.message}`);
    }

    const items = (response.data as unknown as Array<Record<string, unknown>>) ?? [];
    return items.map(parseTopupHistoryItem);
  }

  /**
   * Cancel a pending transaction
   */
  async cancel(transactionId: string): Promise<void> {
    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.TOPUP.CANCEL(transactionId),
      {},
      { requiresAuth: true }
    );

    if (!response.success) {
      throw new KGiTONApiException(`Failed to cancel transaction: ${response.message}`);
    }
  }

  /**
   * Check if top-up is paid
   */
  async isPaid(transactionId: string): Promise<boolean> {
    try {
      const status = await this.getStatus(transactionId);
      return status.status === 'paid' || status.status === 'success';
    } catch {
      return false;
    }
  }

  /**
   * Sync transaction status with payment gateway
   * 
   * Polls the payment gateway (Winpay) for real-time payment status and
   * updates the database accordingly. Useful when webhook callbacks are not received.
   * 
   * Supported payment methods:
   * - QRIS: Uses qr-mpm-query API
   * - Virtual Account: Uses transfer-va/inquiry API
   * 
   * Note: Checkout page payments cannot be polled - must rely on webhook callback.
   */
  async syncStatus(transactionId: string): Promise<SyncTransactionResponse> {
    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.TOPUP.SYNC(transactionId),
      {},
      { requiresAuth: false }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to sync transaction status: ${response.message}`);
    }

    return parseSyncTransactionResponse(response.data);
  }

  /**
   * Get bonus token tiers
   * 
   * Returns the current bonus tier configuration from the server.
   * Tiers are managed by Super Admin and can change over time.
   */
  async getBonusTiers(): Promise<BonusTier[]> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.TOPUP.BONUS_TIERS,
      { requiresAuth: false }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to get bonus tiers: ${response.message}`);
    }

    const tiers = (response.data as unknown as Array<Record<string, unknown>>) ?? [];
    return tiers.map(parseBonusTier);
  }
}
