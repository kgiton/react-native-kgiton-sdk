/**
 * BLE Configuration Constants
 */

export const BLE_CONFIG = {
  /** KGiTON Scale service UUID */
  SERVICE_UUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  
  /** Weight data characteristic UUID */
  WEIGHT_CHARACTERISTIC_UUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  
  /** Control characteristic UUID (for buzzer, tare, etc.) */
  CONTROL_CHARACTERISTIC_UUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a9',
  
  /** Device name prefix for scanning */
  DEVICE_NAME_PREFIX: 'KGiTON',
  
  /** Scan timeout in milliseconds */
  SCAN_TIMEOUT: 10000,
  
  /** Connection timeout in milliseconds */
  CONNECTION_TIMEOUT: 15000,
  
  /** Auto-reconnect delay in milliseconds */
  RECONNECT_DELAY: 3000,
  
  /** Maximum reconnect attempts */
  MAX_RECONNECT_ATTEMPTS: 5,
};

/**
 * BLE Control Commands
 */
export const BLE_COMMANDS = {
  /** Buzzer control */
  BUZZER_ON: 'BUZZER:ON',
  BUZZER_OFF: 'BUZZER:OFF',
  
  /** Tare command */
  TARE: 'TARE',
  
  /** Calibration commands */
  CALIBRATE_START: 'CAL:START',
  CALIBRATE_SET: (weight: number) => `CAL:SET:${weight}`,
  CALIBRATE_END: 'CAL:END',
  
  /** License validation */
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
