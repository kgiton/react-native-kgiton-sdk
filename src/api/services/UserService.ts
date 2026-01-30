/**
 * User Service
 */

import { KGiTONApiClient } from '../KGiTONApiClient';
import { API_ENDPOINTS } from '../../constants/api';
import { KGiTONApiException } from '../../exceptions';
import {
  UserProfileData,
  TokenBalanceData,
  UseTokenRequest,
  UseTokenResponse,
  LicenseKey,
  TokenUsageStats,
  LicenseTokenUsageResponse,
  parseUserProfileData,
  parseTokenBalanceData,
  parseUseTokenResponse,
  parseLicenseKey,
  parseTokenUsageStats,
  parseLicenseTokenUsageResponse,
} from '../../models/license';

/**
 * User service for KGiTON API
 */
export class UserService {
  constructor(private client: KGiTONApiClient) {}

  /**
   * Get user profile with all license keys
   */
  async getProfile(): Promise<UserProfileData> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.USER.PROFILE,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to get profile: ${response.message}`);
    }

    return parseUserProfileData(response.data);
  }

  /**
   * Get token balance from all license keys
   */
  async getTokenBalance(): Promise<TokenBalanceData> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.USER.TOKEN_BALANCE,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to get token balance: ${response.message}`);
    }

    return parseTokenBalanceData(response.data);
  }

  /**
   * Get token usage statistics
   */
  async getTokenUsageStats(): Promise<TokenUsageStats> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.USER.TOKEN_USAGE_STATS,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to get token usage stats: ${response.message}`);
    }

    return parseTokenUsageStats(response.data);
  }

  /**
   * Get per-license token usage details
   */
  async getLicenseTokenUsage(
    licenseKey: string,
    page = 1,
    limit = 20
  ): Promise<LicenseTokenUsageResponse> {
    const response = await this.client.get<Record<string, unknown>>(
      `${API_ENDPOINTS.USER.LICENSE_USAGE(licenseKey)}?page=${page}&limit=${limit}`,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to get license token usage: ${response.message}`);
    }

    return parseLicenseTokenUsageResponse(response.data);
  }

  /**
   * Use 1 token from a license key
   */
  async useToken(licenseKey: string, request?: UseTokenRequest): Promise<UseTokenResponse> {
    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.USER.USE_TOKEN(licenseKey),
      {
        purpose: request?.purpose,
        metadata: request?.metadata,
      },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to use token: ${response.message}`);
    }

    return parseUseTokenResponse(response.data);
  }

  /**
   * Assign additional license key to user
   */
  async assignLicense(licenseKey: string): Promise<LicenseKey> {
    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.USER.ASSIGN_LICENSE,
      { license_key: licenseKey },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to assign license: ${response.message}`);
    }

    return parseLicenseKey(response.data);
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(): Promise<string> {
    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.USER.REGENERATE_API_KEY,
      undefined,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to regenerate API key: ${response.message}`);
    }

    const newApiKey = response.data.api_key as string;
    
    // Update client with new API key
    this.client.setApiKey(newApiKey);
    await this.client.saveConfiguration();

    return newApiKey;
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(): Promise<void> {
    const response = await this.client.post<void>(
      API_ENDPOINTS.USER.REVOKE_API_KEY,
      undefined,
      { requiresAuth: true }
    );

    if (!response.success) {
      throw new KGiTONApiException(`Failed to revoke API key: ${response.message}`);
    }

    // Clear API key from client
    this.client.setApiKey(null);
    await this.client.saveConfiguration();
  }
}
