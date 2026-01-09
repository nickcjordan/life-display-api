import { DeviceConfig } from '../models/device-config';

export const DEFAULT_CONFIG: Omit<DeviceConfig, 'deviceId'> = {
  currentView: 'hello',
  updateInterval: 3600,
  location: {
    latitude: 0.0,
    longitude: 0.0,
    city: 'Unknown',
    timezone: 'UTC',
  },
  preferences: {
    temperatureUnit: 'F',
    displayIcons: true,
    use24HourTime: false,
  },
};

export const CONFIG_CONSTRAINTS = {
  MIN_UPDATE_INTERVAL: 300,      // 5 minutes
  MAX_UPDATE_INTERVAL: 86400,    // 24 hours
  VALID_VIEWS: ['hello', 'weather', 'calendar', 'custom'],
  VALID_TEMP_UNITS: ['C', 'F'],
  MAX_CITY_LENGTH: 100,
} as const;
