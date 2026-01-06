/**
 * Storage Service using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/api';

/**
 * Storage service for persisting SDK data
 */
export class StorageService {
  /**
   * Save access token
   */
  static async saveAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  /**
   * Get access token
   */
  static async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Save refresh token
   */
  static async saveRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  /**
   * Get refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Save API key
   */
  static async saveApiKey(apiKey: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
  }

  /**
   * Get API key
   */
  static async getApiKey(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
  }

  /**
   * Save base URL
   */
  static async saveBaseUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BASE_URL, url);
  }

  /**
   * Get base URL
   */
  static async getBaseUrl(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.BASE_URL);
  }

  /**
   * Clear all tokens
   */
  static async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  }

  /**
   * Clear all credentials
   */
  static async clearCredentials(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.API_KEY,
    ]);
  }

  /**
   * Clear all SDK data
   */
  static async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.BASE_URL,
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.API_KEY,
    ]);
  }

  /**
   * Save custom data
   */
  static async save(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  /**
   * Get custom data
   */
  static async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  /**
   * Remove custom data
   */
  static async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}
