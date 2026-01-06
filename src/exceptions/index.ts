/**
 * KGiTON SDK Exceptions
 */

/**
 * Base exception for all KGiTON SDK errors
 */
export class KGiTONException extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'KGiTONException';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================================================
// API EXCEPTIONS
// ============================================================================

/**
 * Base API exception
 */
export class KGiTONApiException extends KGiTONException {
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'KGiTONApiException';
  }
}

/**
 * Authentication failed (401)
 */
export class KGiTONAuthenticationException extends KGiTONApiException {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'KGiTONAuthenticationException';
  }
}

/**
 * Authorization failed (403)
 */
export class KGiTONAuthorizationException extends KGiTONApiException {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'KGiTONAuthorizationException';
  }
}

/**
 * Validation failed (400)
 */
export class KGiTONValidationException extends KGiTONApiException {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, details);
    this.name = 'KGiTONValidationException';
  }
}

/**
 * Resource not found (404)
 */
export class KGiTONNotFoundException extends KGiTONApiException {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'KGiTONNotFoundException';
  }
}

/**
 * Conflict error (409)
 */
export class KGiTONConflictException extends KGiTONApiException {
  constructor(message = 'Conflict error') {
    super(message, 409);
    this.name = 'KGiTONConflictException';
  }
}

/**
 * Rate limit exceeded (429)
 */
export class KGiTONRateLimitException extends KGiTONApiException {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'KGiTONRateLimitException';
  }
}

/**
 * Network error
 */
export class KGiTONNetworkException extends KGiTONApiException {
  constructor(message = 'Network error') {
    super(message, 0);
    this.name = 'KGiTONNetworkException';
  }
}

// ============================================================================
// BLE EXCEPTIONS
// ============================================================================

/**
 * Base BLE exception
 */
export class KGiTONBleException extends KGiTONException {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'KGiTONBleException';
  }
}

/**
 * BLE not supported or not enabled
 */
export class KGiTONBleNotAvailableException extends KGiTONBleException {
  constructor(message = 'Bluetooth is not available or not enabled') {
    super(message, 'BLE_NOT_AVAILABLE');
    this.name = 'KGiTONBleNotAvailableException';
  }
}

/**
 * BLE permission denied
 */
export class KGiTONBlePermissionException extends KGiTONBleException {
  constructor(message = 'Bluetooth permission denied') {
    super(message, 'BLE_PERMISSION_DENIED');
    this.name = 'KGiTONBlePermissionException';
  }
}

/**
 * Device not found during scan
 */
export class KGiTONBleDeviceNotFoundException extends KGiTONBleException {
  constructor(message = 'Device not found') {
    super(message, 'BLE_DEVICE_NOT_FOUND');
    this.name = 'KGiTONBleDeviceNotFoundException';
  }
}

/**
 * Connection failed
 */
export class KGiTONBleConnectionException extends KGiTONBleException {
  constructor(message = 'Failed to connect to device') {
    super(message, 'BLE_CONNECTION_FAILED');
    this.name = 'KGiTONBleConnectionException';
  }
}

/**
 * License validation failed on device
 */
export class KGiTONBleLicenseException extends KGiTONBleException {
  constructor(message = 'License validation failed') {
    super(message, 'BLE_LICENSE_INVALID');
    this.name = 'KGiTONBleLicenseException';
  }
}
