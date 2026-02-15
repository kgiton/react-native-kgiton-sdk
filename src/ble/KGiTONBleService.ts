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
import { DebugLogger, base64Encode, base64Decode } from '../utils';

/**
 * Callback types
 */
type DeviceCallback = (device: ScaleDevice) => void;
type WeightCallback = (weight: WeightData) => void;
type StateCallback = (state: ScaleConnectionState) => void;

/**
 * Scan options for BLE device scanning
 */
export interface ScanOptions {
  /** Filter by service UUID (default: false - scans ALL devices) */
  filterByServiceUuid?: boolean;
  /** Allow duplicate device reports for RSSI updates (default: true) */
  allowDuplicates?: boolean;
  /** Custom scan timeout in milliseconds (default: BLE_CONFIG.SCAN_TIMEOUT) */
  timeout?: number;
  /** Scan for all devices regardless of name prefix (default: false) */
  scanAllDevices?: boolean;
}

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
  // BLUETOOTH STATE
  // ============================================================================

  /**
   * Check current Bluetooth state without waiting
   * Returns: 'on' | 'off' | 'unavailable' | 'unknown'
   */
  async getBluetoothState(): Promise<'on' | 'off' | 'unavailable' | 'unknown'> {
    if (!this.manager) {
      this.manager = new BleManager();
    }

    const state = await this.manager.state();
    
    switch (state) {
      case State.PoweredOn:
        return 'on';
      case State.PoweredOff:
        return 'off';
      case State.Unsupported:
        return 'unavailable';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if Bluetooth is enabled
   */
  async isBluetoothEnabled(): Promise<boolean> {
    const state = await this.getBluetoothState();
    return state === 'on';
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
      // Android 12+ - need BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      // Also add FINE_LOCATION for better compatibility (some devices still require it)
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    } else {
      // Android 11 and below - need location permission for BLE scanning
      permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
    
    DebugLogger.logBle('Requesting Android permissions', { apiLevel, permissions });

    const results = await PermissionsAndroid.requestMultiple(permissions);
    DebugLogger.logBle('Permission results', results);

    const allGranted = Object.values(results).every(
      (result) => result === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) {
      const deniedPermissions = Object.entries(results)
        .filter(([_, value]) => value !== PermissionsAndroid.RESULTS.GRANTED)
        .map(([key, _]) => key);
      DebugLogger.logBle('Permissions denied', deniedPermissions);
      throw new KGiTONBlePermissionException(`Bluetooth permissions denied: ${deniedPermissions.join(', ')}`);
    }
    
    DebugLogger.logBle('All permissions granted');
  }

  // ============================================================================
  // SCANNING
  // ============================================================================

  /**
   * Start scanning for KGiTON devices
   * 
   * NOTE: By default, this scans for ALL BLE devices and filters by name prefix.
   * This is more reliable because many devices don't advertise their service UUIDs
   * in the advertisement packet (only in the GATT table after connection).
   * 
   * @param onDeviceFound - Callback when a device is found
   * @param options - Optional scan options
   */
  startScan(onDeviceFound: DeviceCallback, options?: ScanOptions): void {
    if (!this.manager) {
      throw new KGiTONBleNotAvailableException('BLE not initialized. Call initialize() first.');
    }

    if (this.isScanning) {
      DebugLogger.logBle('Already scanning');
      return;
    }

    const {
      filterByServiceUuid = false,  // Default: don't filter by service UUID
      allowDuplicates = true,       // Default: allow duplicates for RSSI updates
      timeout = BLE_CONFIG.SCAN_TIMEOUT,
      scanAllDevices = false,
    } = options || {};

    console.log('[KGiTON SDK] [BLE] Starting scan with options:', { 
      filterByServiceUuid, 
      allowDuplicates, 
      timeout, 
      scanAllDevices,
      platform: Platform.OS,
      apiLevel: Platform.OS === 'android' ? Platform.Version : 'N/A'
    });
    
    this.isScanning = true;
    this.onDeviceFoundCallback = onDeviceFound;
    this.updateState(ConnectionState.SCANNING);

    // Use null for service UUIDs to scan ALL devices (more reliable)
    // Only filter by service UUID if explicitly requested
    const serviceUuids = filterByServiceUuid ? [BLE_CONFIG.SERVICE_UUID] : null;
    
    console.log('[KGiTON SDK] [BLE] Calling startDeviceScan with serviceUuids:', serviceUuids);
    
    // Keep track of scan errors for debugging
    let scanErrorCount = 0;

    this.manager.startDeviceScan(
      serviceUuids,
      { allowDuplicates },
      (error, device) => {
        if (error) {
          scanErrorCount++;
          // Always log the error with full details
          console.log('[KGiTON SDK] [BLE] Scan callback error:', {
            message: error.message,
            errorCode: error.errorCode,
            reason: error.reason,
            scanErrorCount
          });
          
          // Only stop for truly critical errors (not error code 101 which can be transient)
          const criticalErrorCodes = [
            600, // BluetoothUnavailable
            601, // BluetoothUnauthorized
            602, // BluetoothPoweredOff
          ];
          
          // For error 101, only stop if we get multiple consecutive errors
          if (error.errorCode === 101 && scanErrorCount > 3) {
            console.log('[KGiTON SDK] [BLE] Too many scan errors, stopping');
            this.stopScan();
          } else if (criticalErrorCodes.includes(error.errorCode ?? 0)) {
            console.log('[KGiTON SDK] [BLE] Critical scan error, stopping:', error.message);
            this.stopScan();
          }
          return;
        }

        if (device) {
          // Log every device found for debugging (even without name)
          console.log('[KGiTON SDK] [BLE] Raw device discovered:', { 
            id: device.id, 
            name: device.name || '(no name)', 
            localName: device.localName || '(no localName)',
            rssi: device.rssi,
            serviceUUIDs: device.serviceUUIDs,
          });
          
          // Check if device matches our criteria
          // Use case-insensitive CONTAINS match (same as Flutter SDK)
          const deviceName = device.name?.toUpperCase() || device.localName?.toUpperCase() || '';
          const targetName = BLE_CONFIG.DEVICE_NAME_PREFIX.toUpperCase();
          const matchesNamePrefix = deviceName.includes(targetName);
          const shouldInclude = scanAllDevices || matchesNamePrefix;
          
          if (shouldInclude) {
            const scaleDevice: ScaleDevice = {
              id: device.id,
              name: device.name || device.localName || `Unknown (${device.id.slice(-6)})`,
              rssi: device.rssi ?? undefined,
              isConnectable: (device as any).isConnectable ?? true,
            };

            console.log('[KGiTON SDK] [BLE] Device matched criteria, returning:', scaleDevice);
            this.onDeviceFoundCallback?.(scaleDevice);
          } else if (device.name || device.localName) {
            console.log('[KGiTON SDK] [BLE] Device skipped (name mismatch):', { 
              name: device.name, 
              localName: device.localName,
              id: device.id,
              expectedContains: BLE_CONFIG.DEVICE_NAME_PREFIX 
            });
          }
        }
      }
    );

    // Auto-stop after timeout
    console.log('[KGiTON SDK] [BLE] Scan started, will auto-stop in', timeout, 'ms');
    setTimeout(() => {
      if (this.isScanning) {
        console.log('[KGiTON SDK] [BLE] Scan timeout reached, stopping');
        this.stopScan();
      }
    }, timeout);
  }

  /**
   * Start scanning for ALL nearby BLE devices (for debugging/discovery)
   * This is useful when you don't know the exact name of your device
   */
  startScanAll(onDeviceFound: DeviceCallback, timeout?: number): void {
    this.startScan(onDeviceFound, { 
      scanAllDevices: true, 
      allowDuplicates: true,
      timeout: timeout || 30000 // Longer timeout for discovery
    });
  }

  /**
   * Stop scanning
   */
  stopScan(): void {
    console.log('[KGiTON SDK] [BLE] stopScan called', { 
      hasManager: !!this.manager, 
      isScanning: this.isScanning,
      connectionState: this.connectionState 
    });
    
    if (!this.manager || !this.isScanning) {
      console.log('[KGiTON SDK] [BLE] stopScan early return - not scanning or no manager');
      return;
    }

    console.log('[KGiTON SDK] [BLE] Stopping scan - calling manager.stopDeviceScan()');
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

      // Request larger MTU for Android to handle full license key command (37+ bytes)
      // Default BLE MTU is 20 bytes which may truncate our commands
      if (Platform.OS === 'android') {
        try {
          const mtu = await (device as any).requestMTU(512);
          console.log('[KGiTON SDK] [BLE] MTU negotiated:', mtu);
        } catch (mtuError) {
          console.log('[KGiTON SDK] [BLE] MTU negotiation failed (using default):', mtuError);
        }
      }

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
   * Connect to device and authorize with license key
   * 
   * This is the recommended method for connecting to KGiTON scales.
   * The firmware requires authorization with a valid license key before
   * it will send weight data.
   * 
   * @param deviceId - BLE device ID (MAC address)
   * @param licenseKey - Full license key (e.g., "YPWH5-EAKT3-HNMX2-RGB6G-55CJ3")
   * @returns ControlResponse indicating success or failure
   * 
   * @example
   * ```typescript
   * const result = await ble.connectWithLicenseKey('AA:BB:CC:DD:EE:FF', 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX');
   * if (result.success) {
   *   // Now receiving weight data
   * }
   * ```
   */
  async connectWithLicenseKey(deviceId: string, licenseKey: string): Promise<ControlResponse> {
    console.log('[KGiTON SDK] [BLE] connectWithLicenseKey:', { deviceId, licenseKeyPreview: licenseKey.substring(0, 5) + '...' });
    
    try {
      // First establish BLE connection
      await this.connect(deviceId);
      
      // Then send CONNECT command with license key to authorize
      console.log('[KGiTON SDK] [BLE] Sending CONNECT command with license key...');
      const response = await this.sendCommand(BLE_COMMANDS.CONNECT_WITH_LICENSE(licenseKey));
      
      console.log('[KGiTON SDK] [BLE] CONNECT command response:', response);
      
      if (!response.success) {
        // License invalid, disconnect
        console.log('[KGiTON SDK] [BLE] License authorization failed, disconnecting...');
        await this.disconnect();
        throw new KGiTONBleLicenseException(response.message || 'License key tidak valid untuk timbangan ini');
      }
      
      console.log('[KGiTON SDK] [BLE] License authorized successfully');
      return response;
      
    } catch (error) {
      console.log('[KGiTON SDK] [BLE] connectWithLicenseKey error:', error);
      // Ensure disconnect on any error
      await this.disconnect().catch(() => {});
      throw error;
    }
  }

  /**
   * Disconnect from device with license key
   * 
   * Sends DISCONNECT command before disconnecting BLE connection.
   * This properly deauthorizes the session on the scale.
   * 
   * @param licenseKey - The same license key used to connect
   */
  async disconnectWithLicenseKey(licenseKey: string): Promise<ControlResponse> {
    console.log('[KGiTON SDK] [BLE] disconnectWithLicenseKey');
    
    if (!this.isConnected()) {
      return { success: true, command: 'DISCONNECT', message: 'Not connected' };
    }
    
    try {
      // Send DISCONNECT command first
      const response = await this.sendCommand(BLE_COMMANDS.DISCONNECT_WITH_LICENSE(licenseKey));
      console.log('[KGiTON SDK] [BLE] DISCONNECT command response:', response);
      
      // Then disconnect BLE
      await this.disconnect();
      
      return response;
    } catch (error) {
      // Disconnect anyway on error
      await this.disconnect().catch(() => {});
      throw error;
    }
  }

  /**
   * Disconnect from device
   * 
   * Note: On Android, we must cancel the device connection FIRST before clearing
   * subscriptions. This is because calling subscription.remove() while connected
   * can crash on Android with "NullPointerException: parameter code is null".
   * When the device connection is cancelled, subscriptions are automatically
   * invalidated on the native side.
   */
  async disconnect(): Promise<void> {
    DebugLogger.logBle('Disconnecting');
    this.autoReconnect = false;
    this.updateState(ConnectionState.DISCONNECTING);

    // First, cancel the device connection - this automatically invalidates subscriptions
    if (this.connectedDevice) {
      try {
        await this.manager?.cancelDeviceConnection(this.connectedDevice.id);
      } catch {
        // Ignore errors during disconnect
      }
      this.connectedDevice = null;
    }

    // Now safe to clean up subscription references
    // Don't call remove() - the subscriptions are already invalid after disconnect
    this.clearSubscriptionReferences();

    this.updateState(ConnectionState.DISCONNECTED);
  }

  /**
   * Clear subscription references without calling remove()
   * Used after device disconnect when subscriptions are already invalidated
   */
  private clearSubscriptionReferences(): void {
    this.weightSubscription = null;
    this.controlSubscription = null;
    this.stateSubscription = null;
  }

  /**
   * Monitor for unexpected disconnection
   */
  private monitorDisconnection(device: Device): void {
    this.stateSubscription = device.onDisconnected((error, disconnectedDevice) => {
      DebugLogger.logBle('Device disconnected', error?.message);
      this.connectedDevice = null;
      // Device already disconnected, subscriptions are invalid - just clear references
      this.clearSubscriptionReferences();

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
   * Subscribe to weight characteristic for real-time weight data
   * 
   * The firmware sends weight data in kg format (e.g., "0.500") via BLE NOTIFY.
   * Data is base64 encoded by react-native-ble-plx.
   */
  private async subscribeToWeight(): Promise<void> {
    if (!this.connectedDevice) {
      console.log('[KGiTON SDK] [BLE] subscribeToWeight: No connected device');
      return;
    }

    console.log('[KGiTON SDK] [BLE] Subscribing to weight characteristic...', {
      serviceUuid: BLE_CONFIG.SERVICE_UUID,
      characteristicUuid: BLE_CONFIG.WEIGHT_CHARACTERISTIC_UUID,
      deviceId: this.connectedDevice.id,
    });

    try {
      this.weightSubscription = this.connectedDevice.monitorCharacteristicForService(
        BLE_CONFIG.SERVICE_UUID,
        BLE_CONFIG.WEIGHT_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.log('[KGiTON SDK] [BLE] Weight subscription error:', {
              message: error.message,
              errorCode: error.errorCode,
              reason: error.reason,
            });
            return;
          }

          if (characteristic?.value) {
            // Decode base64 to string
            const data = base64Decode(characteristic.value);
            console.log('[KGiTON SDK] [BLE] Weight data received (raw):', {
              base64: characteristic.value,
              decoded: data,
            });
            
            const weightData = parseWeightData(data);
            console.log('[KGiTON SDK] [BLE] Weight data parsed:', weightData);
            
            if (this.onWeightDataCallback) {
              this.onWeightDataCallback(weightData);
            } else {
              console.log('[KGiTON SDK] [BLE] No weight callback registered!');
            }
          } else {
            console.log('[KGiTON SDK] [BLE] Weight characteristic has no value');
          }
        }
      );
      
      console.log('[KGiTON SDK] [BLE] Weight subscription created successfully');
    } catch (err) {
      console.log('[KGiTON SDK] [BLE] Failed to subscribe to weight:', err);
    }
  }

  /**
   * Unsubscribe from all characteristics
   * 
   * Note: Wrapped in try-catch because react-native-ble-plx can crash on Android
   * when cancelling subscriptions during disconnect due to null error code in reject.
   * See: https://github.com/dotintent/react-native-ble-plx/issues/758
   */
  private unsubscribeAll(): void {
    // Store references and null them BEFORE calling remove
    // This prevents race conditions where callbacks fire during removal
    const weightSub = this.weightSubscription;
    const controlSub = this.controlSubscription;
    const stateSub = this.stateSubscription;
    
    this.weightSubscription = null;
    this.controlSubscription = null;
    this.stateSubscription = null;

    // Remove subscriptions safely - errors during cancel can crash on Android
    try {
      weightSub?.remove();
    } catch (e) {
      console.log('[KGiTON SDK] [BLE] Error removing weight subscription (ignored):', e);
    }

    try {
      controlSub?.remove();
    } catch (e) {
      console.log('[KGiTON SDK] [BLE] Error removing control subscription (ignored):', e);
    }

    try {
      stateSub?.remove();
    } catch (e) {
      console.log('[KGiTON SDK] [BLE] Error removing state subscription (ignored):', e);
    }
  }

  // ============================================================================
  // CONTROL COMMANDS
  // ============================================================================

  /**
   * Send control command to device and wait for notification response
   * 
   * The ESP32 firmware sends command responses as BLE notifications on the
   * control characteristic (not as part of the write response). This method:
   * 1. Sets up a temporary subscription for the response
   * 2. Writes the command
   * 3. Waits for the notification response (with timeout)
   */
  private async sendCommand(command: string, timeoutMs: number = 2000): Promise<ControlResponse> {
    if (!this.connectedDevice) {
      throw new KGiTONBleConnectionException('Not connected to device');
    }

    DebugLogger.logBle('Sending command', command);

    const base64Command = base64Encode(command);
    console.log('[KGiTON SDK] [BLE] Command:', command, '| Base64:', base64Command);

    return new Promise<ControlResponse>(async (resolve, reject) => {
      let responseSubscription: Subscription | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let isResolved = false;

      // Cleanup function - DON'T call subscription.remove() on Android
      // It causes NullPointerException when the native code tries to reject with null error code
      // Just null the reference - the subscription will be cleaned up when device disconnects
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        // Don't call remove() - it crashes on Android
        // See: https://github.com/dotintent/react-native-ble-plx/issues/758
        responseSubscription = null;
      };

      // Safe resolve that prevents double-resolution
      const safeResolve = (response: ControlResponse) => {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        resolve(response);
      };

      try {
        // Set up timeout
        timeoutId = setTimeout(() => {
          console.log('[KGiTON SDK] [BLE] Command timeout, assuming success');
          // On timeout, assume success since device might not send response for all commands
          safeResolve({ success: true, command, message: 'Timeout - no response' });
        }, timeoutMs);

        // Subscribe to control characteristic for response notification
        responseSubscription = this.connectedDevice!.monitorCharacteristicForService(
          BLE_CONFIG.SERVICE_UUID,
          BLE_CONFIG.CONTROL_CHARACTERISTIC_UUID,
          (error, characteristic) => {
            if (error) {
              console.log('[KGiTON SDK] [BLE] Control response error:', error.message);
              // Don't reject on error, wait for timeout
              return;
            }

            if (characteristic?.value) {
              const response = base64Decode(characteristic.value);
              console.log('[KGiTON SDK] [BLE] Control response received:', response);
              safeResolve(parseControlResponse(response));
            }
          }
        );

        // Small delay to ensure subscription is active
        await new Promise(res => setTimeout(res, 50));

        // Write the command WITH response (firmware uses PROPERTY_WRITE, not WRITE_NR)
        await this.connectedDevice!.writeCharacteristicWithResponseForService(
          BLE_CONFIG.SERVICE_UUID,
          BLE_CONFIG.CONTROL_CHARACTERISTIC_UUID,
          base64Command
        );

        console.log('[KGiTON SDK] [BLE] Command written, waiting for response...');

      } catch (error) {
        DebugLogger.logBle('Command failed', error);
        safeResolve({
          success: false,
          command,
          message: (error as Error).message,
        });
      }
    });
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
   * Validate/authorize license on device
   * 
   * NOTE: This method should be called AFTER connect() to authorize the session.
   * The firmware requires CONNECT:<licenseKey> command to start sending weight data.
   * 
   * Consider using connectWithLicenseKey() instead which handles both connection
   * and authorization in one call.
   * 
   * @param licenseKey - Full license key (e.g., "YPWH5-EAKT3-HNMX2-RGB6G-55CJ3")
   * @returns true if license is valid
   * @throws KGiTONBleLicenseException if license is invalid
   */
  async validateLicense(licenseKey: string): Promise<boolean> {
    const command = BLE_COMMANDS.CONNECT_WITH_LICENSE(licenseKey);
    console.log('[KGiTON SDK] [BLE] Validating license:', licenseKey.substring(0, 5) + '...');
    
    const response = await this.sendCommand(command);
    
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
