/**
 * KGiTON BLE Service
 * 
 * Service for connecting to and communicating with KGiTON BLE scales.
 */

import { BleManager, Device, Subscription, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  BLE_CONFIG,
  BLE_COMMANDS,
  ConnectionState,
  WeightUnit,
} from '../constants/ble';
import {
  ScaleDevice,
  WeightData,
  ScaleConnectionState,
  ControlResponse,
  parseWeightData,
  parseControlResponse,
} from '../models/ble';
import {
  KGiTONBleNotAvailableException,
  KGiTONBlePermissionException,
  KGiTONBleConnectionException,
  KGiTONBleLicenseException,
} from '../exceptions';
import { DebugLogger } from '../utils/DebugLogger';

/**
 * Callback types
 */
type DeviceCallback = (device: ScaleDevice) => void;
type WeightCallback = (weight: WeightData) => void;
type StateCallback = (state: ScaleConnectionState) => void;

/**
 * KGiTON BLE Service
 * 
 * @example
 * ```typescript
 * const ble = new KGiTONBleService();
 * await ble.initialize();
 * 
 * // Scan for devices
 * ble.startScan((device) => {
 *   console.log('Found:', device.name);
 * });
 * 
 * // Connect to a device
 * await ble.connect('DEVICE_ID');
 * 
 * // Listen to weight data
 * ble.onWeightData((weight) => {
 *   console.log('Weight:', weight.value, weight.unit);
 * });
 * ```
 */
export class KGiTONBleService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private isScanning: boolean = false;
  
  // Subscriptions
  private weightSubscription: Subscription | null = null;
  private controlSubscription: Subscription | null = null;
  private stateSubscription: Subscription | null = null;
  
  // Callbacks
  private onDeviceFoundCallback: DeviceCallback | null = null;
  private onWeightDataCallback: WeightCallback | null = null;
  private onStateChangeCallback: StateCallback | null = null;

  // Auto-reconnect
  private autoReconnect: boolean = true;
  private reconnectAttempts: number = 0;
  private lastDeviceId: string | null = null;

  constructor() {
    // Manager will be created on initialize
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize BLE manager and request permissions
   */
  async initialize(): Promise<void> {
    DebugLogger.logBle('Initializing BLE manager');

    if (this.manager) {
      DebugLogger.logBle('BLE manager already initialized');
      return;
    }

    this.manager = new BleManager();

    // Check if Bluetooth is available
    const state = await this.manager.state();
    if (state !== State.PoweredOn) {
      DebugLogger.logBle('Bluetooth not powered on', state);
      
      // Wait for Bluetooth to power on
      await new Promise<void>((resolve, reject) => {
        const subscription = this.manager!.onStateChange((newState) => {
          if (newState === State.PoweredOn) {
            subscription.remove();
            resolve();
          } else if (newState === State.Unsupported) {
            subscription.remove();
            reject(new KGiTONBleNotAvailableException('Bluetooth is not supported'));
          }
        }, true);

        // Timeout after 10 seconds
        setTimeout(() => {
          subscription.remove();
          reject(new KGiTONBleNotAvailableException('Bluetooth is not enabled'));
        }, 10000);
      });
    }

    // Request permissions on Android
    if (Platform.OS === 'android') {
      await this.requestAndroidPermissions();
    }

    DebugLogger.logBle('BLE manager initialized');
  }

  /**
   * Request Android BLE permissions
   */
  private async requestAndroidPermissions(): Promise<void> {
    if (Platform.OS !== 'android') return;

    const apiLevel = Number(Platform.Version);
    const permissions: string[] = [];

    if (apiLevel >= 31) {
      // Android 12+
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
    } else {
      // Android 11 and below
      permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }

    const results = await PermissionsAndroid.requestMultiple(permissions);

    const allGranted = Object.values(results).every(
      (result) => result === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) {
      throw new KGiTONBlePermissionException('Bluetooth permissions denied');
    }
  }

  // ============================================================================
  // SCANNING
  // ============================================================================

  /**
   * Start scanning for KGiTON devices
   */
  startScan(onDeviceFound: DeviceCallback): void {
    if (!this.manager) {
      throw new KGiTONBleNotAvailableException('BLE not initialized. Call initialize() first.');
    }

    if (this.isScanning) {
      DebugLogger.logBle('Already scanning');
      return;
    }

    DebugLogger.logBle('Starting scan');
    this.isScanning = true;
    this.onDeviceFoundCallback = onDeviceFound;
    this.updateState(ConnectionState.SCANNING);

    this.manager.startDeviceScan(
      [BLE_CONFIG.SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          DebugLogger.logBle('Scan error', error.message);
          this.stopScan();
          return;
        }

        if (device && device.name?.startsWith(BLE_CONFIG.DEVICE_NAME_PREFIX)) {
          const scaleDevice: ScaleDevice = {
            id: device.id,
            name: device.name ?? 'Unknown',
            rssi: device.rssi ?? undefined,
            isConnectable: (device as any).isConnectable ?? true,
          };

          DebugLogger.logBle('Device found', scaleDevice);
          this.onDeviceFoundCallback?.(scaleDevice);
        }
      }
    );

    // Auto-stop after timeout
    setTimeout(() => {
      if (this.isScanning) {
        this.stopScan();
      }
    }, BLE_CONFIG.SCAN_TIMEOUT);
  }

  /**
   * Stop scanning
   */
  stopScan(): void {
    if (!this.manager || !this.isScanning) return;

    DebugLogger.logBle('Stopping scan');
    this.manager.stopDeviceScan();
    this.isScanning = false;

    if (this.connectionState === ConnectionState.SCANNING) {
      this.updateState(ConnectionState.DISCONNECTED);
    }
  }

  // ============================================================================
  // CONNECTION
  // ============================================================================

  /**
   * Connect to a device
   */
  async connect(deviceId: string): Promise<void> {
    if (!this.manager) {
      throw new KGiTONBleNotAvailableException('BLE not initialized');
    }

    if (this.connectedDevice) {
      await this.disconnect();
    }

    this.stopScan();
    this.lastDeviceId = deviceId;
    this.updateState(ConnectionState.CONNECTING);

    DebugLogger.logBle('Connecting to device', deviceId);

    try {
      const device = await this.manager.connectToDevice(deviceId, {
        timeout: BLE_CONFIG.CONNECTION_TIMEOUT,
      });

      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevice = device;
      this.reconnectAttempts = 0;
      this.updateState(ConnectionState.CONNECTED, {
        id: device.id,
        name: device.name ?? 'KGiTON Scale',
      });

      // Subscribe to weight characteristic
      await this.subscribeToWeight();

      // Monitor disconnection
      this.monitorDisconnection(device);

      DebugLogger.logBle('Connected successfully');
    } catch (error) {
      DebugLogger.logBle('Connection failed', error);
      this.updateState(ConnectionState.ERROR, undefined, (error as Error).message);
      throw new KGiTONBleConnectionException((error as Error).message);
    }
  }

  /**
   * Disconnect from device
   */
  async disconnect(): Promise<void> {
    DebugLogger.logBle('Disconnecting');
    this.autoReconnect = false;
    this.updateState(ConnectionState.DISCONNECTING);

    this.unsubscribeAll();

    if (this.connectedDevice) {
      try {
        await this.manager?.cancelDeviceConnection(this.connectedDevice.id);
      } catch {
        // Ignore errors during disconnect
      }
      this.connectedDevice = null;
    }

    this.updateState(ConnectionState.DISCONNECTED);
  }

  /**
   * Monitor for unexpected disconnection
   */
  private monitorDisconnection(device: Device): void {
    this.stateSubscription = device.onDisconnected((error, disconnectedDevice) => {
      DebugLogger.logBle('Device disconnected', error?.message);
      this.connectedDevice = null;
      this.unsubscribeAll();

      if (this.autoReconnect && this.lastDeviceId) {
        this.attemptReconnect();
      } else {
        this.updateState(ConnectionState.DISCONNECTED);
      }
    });
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= BLE_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      DebugLogger.logBle('Max reconnect attempts reached');
      this.updateState(ConnectionState.DISCONNECTED);
      return;
    }

    this.reconnectAttempts++;
    DebugLogger.logBle(`Reconnect attempt ${this.reconnectAttempts}`);

    await new Promise((resolve) => setTimeout(resolve, BLE_CONFIG.RECONNECT_DELAY));

    if (this.lastDeviceId) {
      try {
        await this.connect(this.lastDeviceId);
      } catch {
        this.attemptReconnect();
      }
    }
  }

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to weight characteristic
   */
  private async subscribeToWeight(): Promise<void> {
    if (!this.connectedDevice) return;

    this.weightSubscription = this.connectedDevice.monitorCharacteristicForService(
      BLE_CONFIG.SERVICE_UUID,
      BLE_CONFIG.WEIGHT_CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          DebugLogger.logBle('Weight subscription error', error.message);
          return;
        }

        if (characteristic?.value) {
          const data = atob(characteristic.value);
          const weightData = parseWeightData(data);
          DebugLogger.logBle('Weight data', weightData);
          this.onWeightDataCallback?.(weightData);
        }
      }
    );
  }

  /**
   * Unsubscribe from all characteristics
   */
  private unsubscribeAll(): void {
    this.weightSubscription?.remove();
    this.weightSubscription = null;

    this.controlSubscription?.remove();
    this.controlSubscription = null;

    this.stateSubscription?.remove();
    this.stateSubscription = null;
  }

  // ============================================================================
  // CONTROL COMMANDS
  // ============================================================================

  /**
   * Send control command to device
   */
  private async sendCommand(command: string): Promise<ControlResponse> {
    if (!this.connectedDevice) {
      throw new KGiTONBleConnectionException('Not connected to device');
    }

    DebugLogger.logBle('Sending command', command);

    const base64Command = btoa(command);

    try {
      const characteristic = await this.connectedDevice.writeCharacteristicWithResponseForService(
        BLE_CONFIG.SERVICE_UUID,
        BLE_CONFIG.CONTROL_CHARACTERISTIC_UUID,
        base64Command
      );

      if (characteristic.value) {
        const response = atob(characteristic.value);
        return parseControlResponse(response);
      }

      return { success: true, command };
    } catch (error) {
      DebugLogger.logBle('Command failed', error);
      return {
        success: false,
        command,
        message: (error as Error).message,
      };
    }
  }

  /**
   * Control buzzer
   */
  async controlBuzzer(on: boolean): Promise<ControlResponse> {
    return this.sendCommand(on ? BLE_COMMANDS.BUZZER_ON : BLE_COMMANDS.BUZZER_OFF);
  }

  /**
   * Tare the scale
   */
  async tare(): Promise<ControlResponse> {
    return this.sendCommand(BLE_COMMANDS.TARE);
  }

  /**
   * Set weight unit
   */
  async setUnit(unit: WeightUnit): Promise<ControlResponse> {
    const command = unit === WeightUnit.LB ? BLE_COMMANDS.UNIT_LB : BLE_COMMANDS.UNIT_KG;
    return this.sendCommand(command);
  }

  /**
   * Validate license on device
   */
  async validateLicense(licenseKey: string): Promise<boolean> {
    const response = await this.sendCommand(BLE_COMMANDS.LICENSE_VALIDATE(licenseKey));
    
    if (!response.success) {
      throw new KGiTONBleLicenseException(response.message ?? 'License validation failed');
    }

    return true;
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  /**
   * Set callback for weight data
   */
  onWeightData(callback: WeightCallback): void {
    this.onWeightDataCallback = callback;
  }

  /**
   * Set callback for connection state changes
   */
  onStateChange(callback: StateCallback): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * Update connection state
   */
  private updateState(state: ConnectionState, device?: ScaleDevice, error?: string): void {
    this.connectionState = state;

    const stateData: ScaleConnectionState = {
      state,
      device,
      error,
    };

    this.onStateChangeCallback?.(stateData);
  }

  // ============================================================================
  // STATE
  // ============================================================================

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED && this.connectedDevice !== null;
  }

  /**
   * Get connected device
   */
  getConnectedDevice(): ScaleDevice | null {
    if (!this.connectedDevice) return null;

    return {
      id: this.connectedDevice.id,
      name: this.connectedDevice.name ?? 'KGiTON Scale',
    };
  }

  /**
   * Set auto-reconnect behavior
   */
  setAutoReconnect(enabled: boolean): void {
    this.autoReconnect = enabled;
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Destroy the BLE manager
   */
  destroy(): void {
    DebugLogger.logBle('Destroying BLE service');
    this.disconnect();
    this.manager?.destroy();
    this.manager = null;
  }
}
