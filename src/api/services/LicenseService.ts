/**
 * License Service
 */

import { KGiTONApiClient } from '../KGiTONApiClient';
import { API_ENDPOINTS } from '../../constants/api';
import { KGiTONApiException } from '../../exceptions';
import { LicenseValidation, parseLicenseValidation } from '../../models/license';

/**
 * License service for KGiTON API
 */
export class LicenseService {
  constructor(private client: KGiTONApiClient) {}

  /**
   * Validate a license key
   * 
   * This is a public endpoint that doesn't require authentication.
   */
  async validate(licenseKey: string): Promise<LicenseValidation> {
    const response = await this.client.get<Record<string, unknown>>(
      API_ENDPOINTS.LICENSE.VALIDATE(encodeURIComponent(licenseKey)),
      { requiresAuth: false }
    );

    if (!response.success || !response.data) {
      throw new KGiTONApiException(`Failed to validate license: ${response.message}`);
    }

    return parseLicenseValidation(response.data);
  }

  /**
   * Check if license is valid
   */
  async isValid(licenseKey: string): Promise<boolean> {
    try {
      const validation = await this.validate(licenseKey);
      return validation.isValid;
    } catch {
      return false;
    }
  }

  /**
   * Check if license has sufficient tokens
   */
  async hasSufficientTokens(licenseKey: string, required: number = 1): Promise<boolean> {
    try {
      const validation = await this.validate(licenseKey);
      return validation.isValid && validation.tokenBalance >= required;
    } catch {
      return false;
    }
  }

  /**
   * Get token balance for a license key
   */
  async getTokenBalance(licenseKey: string): Promise<number> {
    try {
      const validation = await this.validate(licenseKey);
      return validation.tokenBalance;
    } catch {
      return 0;
    }
  }
}
