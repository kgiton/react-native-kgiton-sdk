/**
 * KGiTON API Client
 * 
 * Low-level HTTP client for KGiTON API with retry logic and error handling.
 */

import { API_CONFIG } from '../constants/api';
import {
  KGiTONApiException,
  KGiTONAuthenticationException,
  KGiTONAuthorizationException,
  KGiTONValidationException,
  KGiTONNotFoundException,
  KGiTONConflictException,
  KGiTONRateLimitException,
  KGiTONNetworkException,
} from '../exceptions';
import { ApiResponse } from '../models/api';
import { DebugLogger } from '../utils/DebugLogger';
import { StorageService } from '../utils/StorageService';

/**
 * API Client configuration
 */
export interface KGiTONApiClientConfig {
  baseUrl?: string;
  accessToken?: string;
  apiKey?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * KGiTON API Client
 */
export class KGiTONApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private apiKey: string | null = null;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: KGiTONApiClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? API_CONFIG.DEFAULT_BASE_URL;
    this.accessToken = config.accessToken ?? null;
    this.apiKey = config.apiKey ?? null;
    this.timeout = config.timeout ?? API_CONFIG.REQUEST_TIMEOUT;
    this.maxRetries = config.maxRetries ?? API_CONFIG.MAX_RETRIES;
    this.retryDelay = config.retryDelay ?? API_CONFIG.RETRY_DELAY;
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setRefreshToken(token: string | null): void {
    this.refreshToken = token;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  setApiKey(key: string | null): void {
    this.apiKey = key;
  }

  hasAccessToken(): boolean {
    return this.accessToken !== null && this.accessToken.length > 0;
  }

  hasApiKey(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  clearCredentials(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.apiKey = null;
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  async saveConfiguration(): Promise<void> {
    await StorageService.saveBaseUrl(this.baseUrl);
    if (this.accessToken) {
      await StorageService.saveAccessToken(this.accessToken);
    }
    if (this.refreshToken) {
      await StorageService.saveRefreshToken(this.refreshToken);
    }
    if (this.apiKey) {
      await StorageService.saveApiKey(this.apiKey);
    }
  }

  async loadConfiguration(): Promise<void> {
    const baseUrl = await StorageService.getBaseUrl();
    if (baseUrl) this.baseUrl = baseUrl;

    this.accessToken = await StorageService.getAccessToken();
    this.refreshToken = await StorageService.getRefreshToken();
    this.apiKey = await StorageService.getApiKey();
  }

  async clearConfiguration(): Promise<void> {
    await StorageService.clearCredentials();
    this.clearCredentials();
  }

  // ============================================================================
  // HTTP METHODS
  // ============================================================================

  private buildUrl(endpoint: string): string {
    const cleanBase = this.baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}${API_CONFIG.API_VERSION}${cleanEndpoint}`;
  }

  private getHeaders(requiresAuth: boolean, useApiKey: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      if (useApiKey && this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      } else if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      } else if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }
    }

    return headers;
  }

  private handleErrorResponse(statusCode: number, message: string, details?: unknown): never {
    switch (statusCode) {
      case 400:
        throw new KGiTONValidationException(message, details);
      case 401:
        throw new KGiTONAuthenticationException(message);
      case 403:
        throw new KGiTONAuthorizationException(message);
      case 404:
        throw new KGiTONNotFoundException(message);
      case 409:
        throw new KGiTONConflictException(message);
      case 429:
        throw new KGiTONRateLimitException(message);
      default:
        throw new KGiTONApiException(message, statusCode, details);
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options: {
      body?: Record<string, unknown>;
      requiresAuth?: boolean;
      useApiKey?: boolean;
    } = {},
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    const { body, requiresAuth = false, useApiKey = false } = options;
    const url = this.buildUrl(endpoint);
    const headers = this.getHeaders(requiresAuth, useApiKey);

    DebugLogger.logRequest(method, url, body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: ApiResponse<T>;
      try {
        data = await response.json() as ApiResponse<T>;
      } catch {
        throw new KGiTONApiException('Invalid JSON response from server', response.status);
      }

      DebugLogger.logResponse(response.status, url, data);

      if (!response.ok) {
        const errorMessage = data.message ?? data.error ?? 'API Error';

        // Don't retry on client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          this.handleErrorResponse(response.status, errorMessage, data.details);
        }

        // Retry on server errors (5xx) and rate limits (429)
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          DebugLogger.warn(`Retry attempt ${attempt}/${this.maxRetries} after ${delay}ms`);
          await this.sleep(delay);
          return this.request<T>(method, endpoint, options, attempt + 1);
        }

        throw new KGiTONApiException(errorMessage, response.status, data.details);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          DebugLogger.warn(`Request timeout. Retry ${attempt}/${this.maxRetries} after ${delay}ms`);
          await this.sleep(delay);
          return this.request<T>(method, endpoint, options, attempt + 1);
        }
        throw new KGiTONNetworkException('Request timeout');
      }

      // Re-throw KGiTON exceptions
      if (error instanceof KGiTONApiException) {
        throw error;
      }

      // Handle network errors with retry
      if (error instanceof Error && attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        DebugLogger.warn(`Network error. Retry ${attempt}/${this.maxRetries} after ${delay}ms`);
        await this.sleep(delay);
        return this.request<T>(method, endpoint, options, attempt + 1);
      }

      throw new KGiTONNetworkException(error instanceof Error ? error.message : 'Network error');
    }
  }

  // Public HTTP methods
  async get<T>(
    endpoint: string,
    options?: { requiresAuth?: boolean; useApiKey?: boolean }
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, options);
  }

  async post<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: { requiresAuth?: boolean; useApiKey?: boolean }
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { body, ...options });
  }

  async put<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: { requiresAuth?: boolean; useApiKey?: boolean }
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { body, ...options });
  }

  async patch<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: { requiresAuth?: boolean; useApiKey?: boolean }
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, { body, ...options });
  }

  async delete<T>(
    endpoint: string,
    options?: { requiresAuth?: boolean; useApiKey?: boolean }
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options);
  }
}
