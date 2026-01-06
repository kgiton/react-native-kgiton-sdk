/**
 * Authentication Models
 */

/**
 * User model
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'super_admin';
  apiKey: string;
  phoneNumber?: string;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Session model
 */
export interface Session {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

/**
 * Auth data (login response)
 */
export interface AuthData {
  user: User;
  session: Session;
}

/**
 * Register request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  licenseKey: string;
  referralCode?: string;
}

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ============================================================================
// PARSERS
// ============================================================================

/**
 * Parse User from API response
 */
export function parseUser(json: Record<string, unknown>): User {
  return {
    id: (json.id as string) ?? '',
    name: (json.name as string) ?? '',
    email: (json.email as string) ?? '',
    role: (json.role as 'user' | 'super_admin') ?? 'user',
    apiKey: (json.api_key as string) ?? '',
    phoneNumber: json.phone_number as string | undefined,
    referralCode: (json.referral_code as string) ?? '',
    referredBy: json.referred_by as string | undefined,
    createdAt: (json.created_at as string) ?? new Date().toISOString(),
    updatedAt: (json.updated_at as string) ?? new Date().toISOString(),
  };
}

/**
 * Parse Session from API response
 */
export function parseSession(json: Record<string, unknown>): Session {
  return {
    accessToken: (json.access_token as string) ?? '',
    refreshToken: json.refresh_token as string | undefined,
    expiresAt: (json.expires_at as number) ?? Math.floor(Date.now() / 1000) + 3600,
  };
}

/**
 * Parse AuthData from API response
 */
export function parseAuthData(json: Record<string, unknown>): AuthData {
  const userJson = json.user as Record<string, unknown>;
  if (!userJson) {
    throw new Error('User data is missing in response');
  }

  return {
    user: parseUser(userJson),
    session: parseSession(json),
  };
}
