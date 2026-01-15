/**
 * KGiTON API Service
 * 
 * Main entry point for KGiTON API integration.
 */

import { KGiTONApiClient, KGiTONApiClientConfig } from './KGiTONApiClient';
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
import { LicenseService } from './services/LicenseService';
import { TopupService } from './services/TopupService';
import { LicenseTransactionService } from './services/LicenseTransactionService';
import { PartnerPaymentService } from './services/PartnerPaymentService';

/**
 * KGiTON API Service
 * 
 * Provides centralized access to all API services:
 * - Authentication (login, register, password reset)
 * - User (profile, token balance, use token)
 * - License (validate license)
 * - Top-up (purchase tokens)
 * - License Transactions (purchase/subscription)
 * - Partner Payment (generate QRIS/checkout page for partner transactions)
 * 
 * @example
 * ```typescript
 * import { KGiTONApiService } from '@kgiton/react-native-sdk';
 * 
 * const api = new KGiTONApiService({
 *   baseUrl: 'https://api.kgiton.com',
 * });
 * 
 * // Login
 * const authData = await api.auth.login({
 *   email: 'user@example.com',
 *   password: 'password123',
 * });
 * 
 * // Get profile
 * const profile = await api.user.getProfile();
 * 
 * // Use token
 * const result = await api.user.useToken('LICENSE-KEY');
 * 
 * // Generate partner payment (QRIS)
 * const payment = await api.partnerPayment.generateQris({
 *   transactionId: 'TRX-001',
 *   amount: 50000,
 *   licenseKey: 'LICENSE-KEY',
 * });
 * ```
 */
export class KGiTONApiService {
  private readonly _client: KGiTONApiClient;

  public readonly auth: AuthService;
  public readonly user: UserService;
  public readonly license: LicenseService;
  public readonly topup: TopupService;
  public readonly licenseTransaction: LicenseTransactionService;
  public readonly partnerPayment: PartnerPaymentService;

  constructor(config: KGiTONApiClientConfig = {}) {
    this._client = new KGiTONApiClient(config);
    this._initializeServices();
  }

  /**
   * Create instance with existing client
   */
  static withClient(client: KGiTONApiClient): KGiTONApiService {
    const service = Object.create(KGiTONApiService.prototype);
    service._client = client;
    service._initializeServices();
    return service;
  }

  private _initializeServices(): void {
    (this as { auth: AuthService }).auth = new AuthService(this._client);
    (this as { user: UserService }).user = new UserService(this._client);
    (this as { license: LicenseService }).license = new LicenseService(this._client);
    (this as { topup: TopupService }).topup = new TopupService(this._client);
    (this as { licenseTransaction: LicenseTransactionService }).licenseTransaction = new LicenseTransactionService(this._client);
    (this as { partnerPayment: PartnerPaymentService }).partnerPayment = new PartnerPaymentService(this._client);
  }

  /**
   * Get the underlying API client
   */
  get client(): KGiTONApiClient {
    return this._client;
  }

  /**
   * Get current base URL
   */
  get baseUrl(): string {
    return this._client.getBaseUrl();
  }

  /**
   * Set base URL
   */
  setBaseUrl(url: string): void {
    this._client.setBaseUrl(url);
  }

  /**
   * Set access token
   */
  setAccessToken(token: string | null): void {
    this._client.setAccessToken(token);
  }

  /**
   * Set API key
   */
  setApiKey(key: string | null): void {
    this._client.setApiKey(key);
  }

  /**
   * Clear all credentials
   */
  clearCredentials(): void {
    this._client.clearCredentials();
  }

  /**
   * Save configuration to storage
   */
  async saveConfiguration(): Promise<void> {
    await this._client.saveConfiguration();
  }

  /**
   * Load configuration from storage
   */
  async loadConfiguration(): Promise<void> {
    await this._client.loadConfiguration();
  }

  /**
   * Clear saved configuration
   */
  async clearConfiguration(): Promise<void> {
    await this._client.clearConfiguration();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }
}
