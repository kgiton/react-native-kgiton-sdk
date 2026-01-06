/**
 * Authentication Service
 */

import { KGiTONApiClient } from '../KGiTONApiClient';
import { API_ENDPOINTS } from '../../constants/api';
import {
  AuthData,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  parseAuthData,
} from '../../models/auth';

/**
 * Authentication service for KGiTON API
 */
export class AuthService {
  constructor(private client: KGiTONApiClient) {}

  /**
   * Register a new user with license key
   */
  async register(request: RegisterRequest): Promise<string> {
    const response = await this.client.post<void>(
      API_ENDPOINTS.AUTH.REGISTER,
      {
        email: request.email,
        password: request.password,
        name: request.name,
        license_key: request.licenseKey,
        referral_code: request.referralCode,
      },
      { requiresAuth: false }
    );

    if (!response.success) {
      throw new Error(`Registration failed: ${response.message}`);
    }

    return response.message;
  }

  /**
   * Login user
   */
  async login(request: LoginRequest): Promise<AuthData> {
    const response = await this.client.post<Record<string, unknown>>(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        email: request.email,
        password: request.password,
      },
      { requiresAuth: false }
    );

    if (!response.success || !response.data) {
      throw new Error(`Login failed: ${response.message}`);
    }

    const authData = parseAuthData(response.data);

    // Save tokens to client
    this.client.setAccessToken(authData.session.accessToken);
    if (authData.session.refreshToken) {
      this.client.setRefreshToken(authData.session.refreshToken);
    }
    this.client.setApiKey(authData.user.apiKey);
    await this.client.saveConfiguration();

    return authData;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.client.post<void>(
        API_ENDPOINTS.AUTH.LOGOUT,
        undefined,
        { requiresAuth: true }
      );
    } finally {
      // Always clear local tokens
      this.client.clearCredentials();
      await this.client.clearConfiguration();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.client.hasAccessToken() || this.client.hasApiKey();
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.client.getAccessToken();
  }

  /**
   * Get current API key
   */
  getApiKey(): string | null {
    return this.client.getApiKey();
  }

  /**
   * Request password reset via email
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    const response = await this.client.post<void>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email: request.email },
      { requiresAuth: false }
    );

    if (!response.success) {
      throw new Error(`Failed to request password reset: ${response.message}`);
    }
  }

  /**
   * Reset password using token from email
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    const response = await this.client.post<void>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      {
        token: request.token,
        new_password: request.newPassword,
      },
      { requiresAuth: false }
    );

    if (!response.success) {
      throw new Error(`Failed to reset password: ${response.message}`);
    }
  }
}
