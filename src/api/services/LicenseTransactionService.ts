/**
 * License Transaction Service
 */

import { KGiTONApiClient } from '../KGiTONApiClient';
import { API_ENDPOINTS } from '../../constants/api';
import { KGiTONApiException } from '../../exceptions';
import {
  LicenseTransactionRequest,
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
   * Request a license transaction (buy/rent)
   */
  async request(request: LicenseTransactionRequest): Promise<LicenseTransactionData> {
    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.LICENSE_TRANSACTION.REQUEST,
      {
        license_key: request.licenseKey,
        transaction_type: request.transactionType,
        payment_type: request.paymentType ?? 'qris',
        subscription_months: request.subscriptionMonths,
      },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to request license transaction: ${response.message}`);
    }

    return parseLicenseTransactionData(response.data);
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
   * Get transaction history
   */
  async getHistory(): Promise<LicenseTransactionHistoryItem[]> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.LICENSE_TRANSACTION.HISTORY,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to get transaction history: ${response.message}`);
    }

    const items = (response.data.items as Array<Record<string, unknown>>) ?? [];
    return items.map(parseLicenseTransactionHistoryItem);
  }

  /**
   * Check if transaction is paid
   */
  async isPaid(transactionId: string): Promise<boolean> {
    try {
      const status = await this.getStatus(transactionId);
      return status.status === 'paid';
    } catch {
      return false;
    }
  }
}
