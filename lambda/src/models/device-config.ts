/**
 * Device configuration interface matching DynamoDB schema
 */
export interface DeviceConfig {
  deviceId: string;
  currentView: string;
  updateInterval: number;
  location: Location;
  preferences: Preferences;
  createdAt?: string;
  updatedAt?: string;
  lastSeen?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  timezone: string;
}

export interface Preferences {
  temperatureUnit: 'C' | 'F';
  displayIcons: boolean;
  use24HourTime: boolean;
}

/**
 * Partial config for updates (all fields optional except deviceId)
 */
export interface UpdateDeviceConfigInput {
  currentView?: string;
  updateInterval?: number;
  location?: Partial<Location>;
  preferences?: Partial<Preferences>;
}

/**
 * API response types
 */
export interface GetConfigResponse extends DeviceConfig {}

export interface UpdateConfigResponse {
  deviceId: string;
  message: string;
  updatedAt: string;
}

export interface ListDevicesResponse {
  devices: Array<{
    deviceId: string;
    lastSeen?: string;
    currentView: string;
  }>;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  deviceId?: string;
}
