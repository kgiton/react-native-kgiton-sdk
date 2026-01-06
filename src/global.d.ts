/**
 * Global type declarations for React Native SDK
 */

// React Native AsyncStorage
declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    multiSet(keyValuePairs: [string, string][]): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<string[]>;
  };
  export default AsyncStorage;
}

// React Native BLE PLX
declare module 'react-native-ble-plx' {
  export class BleManager {
    constructor();
    destroy(): void;
    onStateChange(listener: (state: State) => void, emitCurrentState?: boolean): Subscription;
    state(): Promise<State>;
    startDeviceScan(
      UUIDs: string[] | null,
      options: object | null,
      listener: (error: BleError | null, device: Device | null) => void
    ): void;
    stopDeviceScan(): void;
    connectToDevice(deviceId: string, options?: object): Promise<Device>;
    cancelDeviceConnection(deviceId: string): Promise<Device>;
    isDeviceConnected(deviceId: string): Promise<boolean>;
    discoverAllServicesAndCharacteristicsForDevice(deviceId: string): Promise<Device>;
    servicesForDevice(deviceId: string): Promise<Service[]>;
    characteristicsForDevice(deviceId: string, serviceUUID: string): Promise<Characteristic[]>;
    readCharacteristicForDevice(
      deviceId: string,
      serviceUUID: string,
      characteristicUUID: string
    ): Promise<Characteristic>;
    writeCharacteristicWithResponseForDevice(
      deviceId: string,
      serviceUUID: string,
      characteristicUUID: string,
      value: string
    ): Promise<Characteristic>;
    writeCharacteristicWithoutResponseForDevice(
      deviceId: string,
      serviceUUID: string,
      characteristicUUID: string,
      value: string
    ): Promise<Characteristic>;
    monitorCharacteristicForDevice(
      deviceId: string,
      serviceUUID: string,
      characteristicUUID: string,
      listener: (error: BleError | null, characteristic: Characteristic | null) => void
    ): Subscription;
  }

  export enum State {
    Unknown = 'Unknown',
    Resetting = 'Resetting',
    Unsupported = 'Unsupported',
    Unauthorized = 'Unauthorized',
    PoweredOff = 'PoweredOff',
    PoweredOn = 'PoweredOn',
  }

  export interface Device {
    id: string;
    name: string | null;
    localName: string | null;
    rssi: number | null;
    serviceUUIDs: string[] | null;
    connect(options?: object): Promise<Device>;
    cancelConnection(): Promise<Device>;
    isConnected(): Promise<boolean>;
    discoverAllServicesAndCharacteristics(): Promise<Device>;
    services(): Promise<Service[]>;
    characteristicsForService(serviceUUID: string): Promise<Characteristic[]>;
    readCharacteristicForService(serviceUUID: string, characteristicUUID: string): Promise<Characteristic>;
    writeCharacteristicWithResponseForService(
      serviceUUID: string,
      characteristicUUID: string,
      value: string
    ): Promise<Characteristic>;
    monitorCharacteristicForService(
      serviceUUID: string,
      characteristicUUID: string,
      listener: (error: BleError | null, characteristic: Characteristic | null) => void
    ): Subscription;
    onDisconnected(listener: (error: BleError | null, device: Device) => void): Subscription;
  }

  export interface Service {
    id: number;
    uuid: string;
    deviceID: string;
    isPrimary: boolean;
  }

  export interface Characteristic {
    id: number;
    uuid: string;
    serviceUUID: string;
    deviceID: string;
    isReadable: boolean;
    isWritableWithResponse: boolean;
    isWritableWithoutResponse: boolean;
    isNotifiable: boolean;
    isIndicatable: boolean;
    value: string | null;
  }

  export interface Subscription {
    remove(): void;
  }

  export interface BleError {
    errorCode: number;
    message: string;
    reason: string | null;
  }
}

// React Native core
declare module 'react-native' {
  export const Platform: {
    OS: 'ios' | 'android' | 'web';
    Version: number | string;
    select<T>(specifics: { ios?: T; android?: T; web?: T; default?: T }): T;
  };

  export const PermissionsAndroid: {
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: string;
      ACCESS_COARSE_LOCATION: string;
      BLUETOOTH_SCAN: string;
      BLUETOOTH_CONNECT: string;
    };
    RESULTS: {
      GRANTED: string;
      DENIED: string;
      NEVER_ASK_AGAIN: string;
    };
    request(permission: string, rationale?: object): Promise<string>;
    requestMultiple(permissions: string[]): Promise<Record<string, string>>;
    check(permission: string): Promise<boolean>;
  };
}
