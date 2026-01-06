/**
 * License Models
 */

/**
 * License key model
 */
export interface LicenseKey {
  licenseKey: string;
  status: 'active' | 'inactive' | 'suspended' | 'expired';
  purchaseType?: 'buy' | 'rent';
  tokenBalance: number;
  pricePerToken: number;
  deviceName?: string;
  deviceModel?: string;
  subscriptionStatus?: 'active' | 'inactive' | 'expired';
  subscriptionValidUntil?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * License validation response
 */
export interface LicenseValidation {
  licenseKey: string;
  exists: boolean;
  isValid: boolean;
  isAssigned: boolean;
  status: string;
  tokenBalance: number;
  pricePerToken: number;
  deviceName?: string;
  deviceModel?: string;
  purchaseType?: string;
  subscriptionStatus?: string;
  subscriptionValid?: boolean;
  subscriptionDueDate?: string;
}

/**
 * User profile data with license keys
 */
export interface UserProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    apiKey: string;
    referralCode: string;
  };
  licenseKeys: LicenseKey[];
}

/**
 * Token balance data
 */
export interface TokenBalanceData {
  totalBalance: number;
  licenseKeys: Array<{
    licenseKey: string;
    tokenBalance: number;
    pricePerToken: number;
    status: string;
  }>;
}

/**
 * Use token request
 */
export interface UseTokenRequest {
  purpose?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Use token response
 */
export interface UseTokenResponse {
  licenseKey: string;
  previousBalance: number;
  newBalance: number;
  tokensUsed: number;
}

/**
 * Assign license request
 */
export interface AssignLicenseRequest {
  licenseKey: string;
}

// ============================================================================
// PARSERS
// ============================================================================

/**
 * Parse LicenseKey from API response
 */
export function parseLicenseKey(json: Record<string, unknown>): LicenseKey {
  return {
    licenseKey: (json.license_key as string) ?? '',
    status: (json.status as LicenseKey['status']) ?? 'inactive',
    purchaseType: json.purchase_type as 'buy' | 'rent' | undefined,
    tokenBalance: (json.token_balance as number) ?? 0,
    pricePerToken: (json.price_per_token as number) ?? 0,
    deviceName: json.device_name as string | undefined,
    deviceModel: json.device_model as string | undefined,
    subscriptionStatus: json.subscription_status as 'active' | 'inactive' | 'expired' | undefined,
    subscriptionValidUntil: json.subscription_valid_until as string | undefined,
    assignedAt: json.assigned_at as string | undefined,
    createdAt: (json.created_at as string) ?? new Date().toISOString(),
    updatedAt: (json.updated_at as string) ?? new Date().toISOString(),
  };
}

/**
 * Parse LicenseValidation from API response
 */
export function parseLicenseValidation(json: Record<string, unknown>): LicenseValidation {
  return {
    licenseKey: (json.license_key as string) ?? '',
    exists: (json.exists as boolean) ?? false,
    isValid: (json.is_valid as boolean) ?? false,
    isAssigned: (json.is_assigned as boolean) ?? false,
    status: (json.status as string) ?? '',
    tokenBalance: (json.token_balance as number) ?? 0,
    pricePerToken: (json.price_per_token as number) ?? 0,
    deviceName: json.device_name as string | undefined,
    deviceModel: json.device_model as string | undefined,
    purchaseType: json.purchase_type as string | undefined,
    subscriptionStatus: json.subscription_status as string | undefined,
    subscriptionValid: json.subscription_valid as boolean | undefined,
    subscriptionDueDate: json.subscription_due_date as string | undefined,
  };
}

/**
 * Parse UseTokenResponse from API response
 */
export function parseUseTokenResponse(json: Record<string, unknown>): UseTokenResponse {
  return {
    licenseKey: (json.license_key as string) ?? '',
    previousBalance: (json.previous_balance as number) ?? 0,
    newBalance: (json.new_balance as number) ?? 0,
    tokensUsed: (json.tokens_used as number) ?? 1,
  };
}

/**
 * Parse TokenBalanceData from API response
 */
export function parseTokenBalanceData(json: Record<string, unknown>): TokenBalanceData {
  const licenseKeysJson = (json.license_keys as Array<Record<string, unknown>>) ?? [];
  
  return {
    totalBalance: (json.total_balance as number) ?? 0,
    licenseKeys: licenseKeysJson.map((lk) => ({
      licenseKey: (lk.license_key as string) ?? '',
      tokenBalance: (lk.token_balance as number) ?? 0,
      pricePerToken: (lk.price_per_token as number) ?? 0,
      status: (lk.status as string) ?? '',
    })),
  };
}

/**
 * Parse UserProfileData from API response
 */
export function parseUserProfileData(json: Record<string, unknown>): UserProfileData {
  const userJson = (json.user as Record<string, unknown>) ?? {};
  const licenseKeysJson = (json.license_keys as Array<Record<string, unknown>>) ?? [];
  
  return {
    user: {
      id: (userJson.id as string) ?? '',
      name: (userJson.name as string) ?? '',
      email: (userJson.email as string) ?? '',
      role: (userJson.role as string) ?? 'user',
      apiKey: (userJson.api_key as string) ?? '',
      referralCode: (userJson.referral_code as string) ?? '',
    },
    licenseKeys: licenseKeysJson.map(parseLicenseKey),
  };
}
