/**
 * License Transaction Service
 */

import { KGiTONApiClient } from '../KGiTONApiClient';
import { API_ENDPOINTS } from '../../constants/api';
import { KGiTONApiException } from '../../exceptions';
import {
  LicenseTransactionPurchaseRequest,
  LicenseTransactionSubscriptionRequest,
  LicenseTransactionData,
  LicenseTransactionStatusData,
  LicenseTransactionHistoryItem,
  parseLicenseTransactionData,
  parseLicenseTransactionStatusData,
  parseLicenseTransactionHistoryItem,
} from '../../models/licenseTransaction';

/**
 * License transaction service for KGiTON API
 */
export class LicenseTransactionService {
  constructor(private client: KGiTONApiClient) {}

  /**
   * Initiate license purchase payment (for buy type)
   */
  async initiatePurchase(request: LicenseTransactionPurchaseRequest): Promise<LicenseTransactionData> {
    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.LICENSE_TRANSACTION.PURCHASE,
      {
        license_key: request.licenseKey,
        payment_method: request.paymentMethod ?? 'checkout_page',
        customer_phone: request.customerPhone,
      },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to initiate purchase: ${response.message}`);
    }

    return parseLicenseTransactionData(response.data);
  }

  /**
   * Initiate license subscription payment (for rent type)
   */
  async initiateSubscription(request: LicenseTransactionSubscriptionRequest): Promise<LicenseTransactionData> {
    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.LICENSE_TRANSACTION.SUBSCRIPTION,
      {
        license_key: request.licenseKey,
        payment_method: request.paymentMethod ?? 'checkout_page',
        customer_phone: request.customerPhone,
      },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to initiate subscription: ${response.message}`);
    }

    return parseLicenseTransactionData(response.data);
  }

  /**
   * Get my license transactions
   */
  async getMyTransactions(): Promise<LicenseTransactionHistoryItem[]> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.LICENSE_TRANSACTION.MY,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to get transactions: ${response.message}`);
    }

    const items = (response.data as unknown as Array<Record<string, unknown>>) ?? [];
    return items.map(parseLicenseTransactionHistoryItem);
  }

  /**
   * Check transaction status
   */
  async getStatus(transactionId: string): Promise<LicenseTransactionStatusData> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.LICENSE_TRANSACTION.STATUS(transactionId),
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to get transaction status: ${response.message}`);
    }

    return parseLicenseTransactionStatusData(response.data);
  }

  /**
   * Check if transaction is paid
   */
  async isPaid(transactionId: string): Promise<boolean> {
    try {
      const status = await this.getStatus(transactionId);
      return status.status === 'paid' || status.status === 'success';
    } catch {
      return false;
    }
  }
}
