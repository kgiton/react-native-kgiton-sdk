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
  parseTopupData,
  parseTopupStatusData,
  parseTopupHistoryItem,
} from '../../models/topup';

/**
 * Top-up service for KGiTON API
 */
export class TopupService {
  constructor(private client: KGiTONApiClient) {}

  /**
   * Request a token top-up
   */
  async request(request: TopupRequest): Promise<TopupData> {
    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.TOPUP.REQUEST,
      {
        token_count: request.tokenCount,
        license_key: request.licenseKey,
        payment_type: request.paymentType ?? 'qris',
      },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to request top-up: ${response.message}`);
    }

    return parseTopupData(response.data);
  }

  /**
   * Check top-up status
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

    const items = (response.data.items as Array<Record<string, unknown>>) ?? [];
    return items.map(parseTopupHistoryItem);
  }

  /**
   * Check if top-up is paid
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
