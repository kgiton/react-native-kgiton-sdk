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
 */
export function parseWeightData(data: string): WeightData {
  // Expected format: "WEIGHT:123.45:KG:STABLE" or "WEIGHT:123.45:LB:UNSTABLE"
  const parts = data.split(':');
  
  if (parts.length < 4 || parts[0] !== 'WEIGHT') {
    return {
      value: 0,
      unit: WeightUnit.KG,
      isStable: false,
      isOverload: false,
      timestamp: Date.now(),
    };
  }
  
  const value = parseFloat(parts[1]) || 0;
  const unitStr = parts[2]?.toUpperCase();
  const statusStr = parts[3]?.toUpperCase();
  
  let unit: WeightUnit = WeightUnit.KG;
  if (unitStr === 'LB') unit = WeightUnit.LB;
  else if (unitStr === 'G') unit = WeightUnit.G;
  
  return {
    value,
    unit,
    isStable: statusStr === 'STABLE',
    isOverload: statusStr === 'OVERLOAD',
    timestamp: Date.now(),
  };
}

/**
 * Parse control response from BLE characteristic value
 */
export function parseControlResponse(data: string): ControlResponse {
  // Expected format: "OK:COMMAND" or "ERROR:COMMAND:message"
  const parts = data.split(':');
  
  if (parts[0] === 'OK') {
    return {
      success: true,
      command: parts[1] ?? '',
    };
  }
  
  return {
    success: false,
    command: parts[1] ?? '',
    message: parts.slice(2).join(':') || 'Unknown error',
  };
}
