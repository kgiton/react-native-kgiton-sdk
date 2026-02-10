/**
 * BLE Configuration Constants
 * 
 * NOTE: These UUIDs must match the firmware on the ESP32 scale device.
 * Synced with Flutter SDK (flutter-kgiton-sdk/lib/src/constants/ble_constants.dart)
 * and ESP32 Firmware (CRANE_SCALE_V6_DEMO.ino)
 */

export const BLE_CONFIG = {
  /** KGiTON Scale service UUID - MUST match ESP32 firmware */
  SERVICE_UUID: '12345678-1234-1234-1234-123456789abc',
  
  /** Weight data characteristic UUID (TX from scale - sends weight data) */
  WEIGHT_CHARACTERISTIC_UUID: 'abcd1234-1234-1234-1234-123456789abc',
  
  /** Auth characteristic UUID (for token-based authentication - legacy) */
  AUTH_CHARACTERISTIC_UUID: 'abcd0001-1234-1234-1234-123456789abc',
  
  /** Control characteristic UUID (for connection control with license key) */
  CONTROL_CHARACTERISTIC_UUID: 'abcd0002-1234-1234-1234-123456789abc',
  
  /** Buzzer control characteristic UUID */
  BUZZER_CHARACTERISTIC_UUID: 'abcd9999-1234-1234-1234-123456789abc',
  
  /** Device name prefix for scanning - case-insensitive contains match */
  /** Device name format: KGiTON-XXXXX (where XXXXX is first 5 chars of license key) */
  DEVICE_NAME_PREFIX: 'KGiTON',
  
  /** Scan timeout in milliseconds */
  SCAN_TIMEOUT: 15000,
  
  /** Connection timeout in milliseconds */
  CONNECTION_TIMEOUT: 15000,
  
  /** Auto-reconnect delay in milliseconds */
  RECONNECT_DELAY: 3000,
  
  /** Maximum reconnect attempts */
  MAX_RECONNECT_ATTEMPTS: 5,
};

/**
 * BLE Control Commands
 * 
 * NOTE: These commands must match the firmware protocol.
 * Synced with Flutter SDK and ESP32 Firmware (CRANE_SCALE_V6_DEMO.ino)
 */
export const BLE_COMMANDS = {
  /** Buzzer control */
  BUZZER_ON: 'BUZZ',       // or 'BEEP' or 'ON'
  BUZZER_OFF: 'OFF',
  BUZZER_LONG: 'LONG',
  
  /** Tare command */
  TARE: 'TARE',
  
  /** Calibration commands */
  CALIBRATE_START: 'CAL:START',
  CALIBRATE_SET: (weight: number) => `CAL:SET:${weight}`,
  CALIBRATE_END: 'CAL:END',
  
  /** 
   * License key connection commands (firmware protocol)
   * Format: CONNECT:<license_key> or DISCONNECT:<license_key>
   */
  CONNECT_WITH_LICENSE: (licenseKey: string) => `CONNECT:${licenseKey.trim()}`,
  DISCONNECT_WITH_LICENSE: (licenseKey: string) => `DISCONNECT:${licenseKey.trim()}`,
  
  /** Legacy license validation (not used by firmware) */
  LICENSE_VALIDATE: (key: string) => `LICENSE:${key}`,
  
  /** Weight unit toggle */
  UNIT_KG: 'UNIT:KG',
  UNIT_LB: 'UNIT:LB',
};

/**
 * Weight units
 */
export enum WeightUnit {
  KG = 'kg',
  LB = 'lb',
  G = 'g',
}

/**
 * Connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  SCANNING = 'scanning',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  ERROR = 'error',
}
