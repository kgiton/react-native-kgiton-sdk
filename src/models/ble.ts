/**
 * BLE Models
 */

import { ConnectionState, WeightUnit } from '../constants/ble';

/**
 * Scale device info
 */
export interface ScaleDevice {
  id: string;
  name: string;
  rssi?: number;
  isConnectable?: boolean;
}

/**
 * Weight data from scale
 */
export interface WeightData {
  value: number;
  unit: WeightUnit;
  isStable: boolean;
  isOverload: boolean;
  timestamp: number;
}

/**
 * Scale connection state with optional device
 */
export interface ScaleConnectionState {
  state: ConnectionState;
  device?: ScaleDevice;
  error?: string;
}

/**
 * Control response from scale
 */
export interface ControlResponse {
  success: boolean;
  command: string;
  message?: string;
}

/**
 * Parse weight data from BLE characteristic value
 * 
 * Supports two formats:
 * 1. Simple kg value from firmware: "0.500" or "1.250" (weight in kg, 3 decimal places)
 * 2. Legacy format: "WEIGHT:123.45:KG:STABLE"
 */
export function parseWeightData(data: string): WeightData {
  const trimmedData = data.trim();
  
  console.log('[KGiTON SDK] [BLE] parseWeightData input:', JSON.stringify(trimmedData));
  
  // Try parsing as simple kg value first (firmware format)
  // Firmware sends weight in kg with 3 decimal places, e.g., "0.500", "1.250"
  const simpleValue = parseFloat(trimmedData);
  if (!isNaN(simpleValue) && !trimmedData.includes(':')) {
    console.log('[KGiTON SDK] [BLE] Parsed as simple kg value:', simpleValue);
    return {
      value: simpleValue,
      unit: WeightUnit.KG,
      isStable: true, // Firmware handles stability internally
      isOverload: simpleValue > 300, // Max weight is 300kg per firmware
      timestamp: Date.now(),
    };
  }
  
  // Legacy format: "WEIGHT:123.45:KG:STABLE" or "WEIGHT:123.45:LB:UNSTABLE"
  const parts = trimmedData.split(':');
  
  if (parts.length >= 4 && parts[0] === 'WEIGHT') {
    const value = parseFloat(parts[1]) || 0;
    const unitStr = parts[2]?.toUpperCase();
    const statusStr = parts[3]?.toUpperCase();
    
    let unit: WeightUnit = WeightUnit.KG;
    if (unitStr === 'LB') unit = WeightUnit.LB;
    else if (unitStr === 'G') unit = WeightUnit.G;
    
    console.log('[KGiTON SDK] [BLE] Parsed as legacy format:', { value, unit, status: statusStr });
    return {
      value,
      unit,
      isStable: statusStr === 'STABLE',
      isOverload: statusStr === 'OVERLOAD',
      timestamp: Date.now(),
    };
  }
  
  // Unknown format, return zero
  console.log('[KGiTON SDK] [BLE] parseWeightData: unknown format, returning zero');
  return {
    value: 0,
    unit: WeightUnit.KG,
    isStable: false,
    isOverload: false,
    timestamp: Date.now(),
  };
}

/**
 * Parse control response from BLE characteristic value
 * 
 * Firmware response format:
 * - Success: "CONNECTED", "DISCONNECTED"
 * - Already done: "ALREADY_CONNECTED", "ALREADY_DISCONNECTED"
 * - Errors: "ERROR:INVALID_LICENSE", "ERROR:INVALID_KEY", "ERROR:INVALID_FORMAT"
 */
export function parseControlResponse(data: string): ControlResponse {
  const trimmed = data.trim();
  
  // Handle error responses: ERROR:<code>
  if (trimmed.startsWith('ERROR:')) {
    const errorCode = trimmed.substring(6);
    return {
      success: false,
      command: 'ERROR',
      message: getErrorMessage(errorCode),
    };
  }
  
  // Handle success responses
  switch (trimmed) {
    case 'CONNECTED':
      return {
        success: true,
        command: 'CONNECT',
        message: 'Berhasil terhubung',
      };
    case 'DISCONNECTED':
      return {
        success: true,
        command: 'DISCONNECT',
        message: 'Berhasil terputus',
      };
    case 'ALREADY_CONNECTED':
      // Treat as success - device is already authenticated
      return {
        success: true,
        command: 'CONNECT',
        message: 'Sudah terhubung',
      };
    case 'ALREADY_DISCONNECTED':
      return {
        success: true,
        command: 'DISCONNECT',
        message: 'Sudah terputus',
      };
    case 'OK':
      return {
        success: true,
        command: trimmed,
        message: 'OK',
      };
    default:
      // Unknown response - log and return success to not block
      console.log('[KGiTON SDK] Unknown control response:', trimmed);
      return {
        success: true,
        command: trimmed,
        message: trimmed,
      };
  }
}

/**
 * Get human-readable error message from error code
 */
function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'INVALID_LICENSE':
    case 'INVALID_KEY':
      return 'License key tidak valid';
    case 'INVALID_FORMAT':
      return 'Format perintah salah';
    case 'UNKNOWN_COMMAND':
      return 'Perintah tidak dikenal';
    default:
      return `Error: ${errorCode}`;
  }
}

