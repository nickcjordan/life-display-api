import { CONFIG_CONSTRAINTS } from '../constants/defaults';
import { UpdateDeviceConfigInput } from '../models/device-config';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateDeviceId(deviceId: string): ValidationResult {
  const errors: string[] = [];

  if (!deviceId || deviceId.trim().length === 0) {
    errors.push('deviceId is required');
  }

  if (deviceId.length > 100) {
    errors.push('deviceId must be less than 100 characters');
  }

  // Allow alphanumeric, hyphens, underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(deviceId)) {
    errors.push('deviceId must contain only alphanumeric characters, hyphens, and underscores');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdateConfig(
  input: UpdateDeviceConfigInput
): ValidationResult {
  const errors: string[] = [];

  if (input.currentView !== undefined) {
    if (!(CONFIG_CONSTRAINTS.VALID_VIEWS as readonly string[]).includes(input.currentView)) {
      errors.push(
        `currentView must be one of: ${CONFIG_CONSTRAINTS.VALID_VIEWS.join(', ')}`
      );
    }
  }

  if (input.updateInterval !== undefined) {
    if (
      input.updateInterval < CONFIG_CONSTRAINTS.MIN_UPDATE_INTERVAL ||
      input.updateInterval > CONFIG_CONSTRAINTS.MAX_UPDATE_INTERVAL
    ) {
      errors.push(
        `updateInterval must be between ${CONFIG_CONSTRAINTS.MIN_UPDATE_INTERVAL} and ${CONFIG_CONSTRAINTS.MAX_UPDATE_INTERVAL}`
      );
    }
  }

  if (input.location) {
    if (input.location.latitude !== undefined) {
      if (input.location.latitude < -90 || input.location.latitude > 90) {
        errors.push('latitude must be between -90 and 90');
      }
    }

    if (input.location.longitude !== undefined) {
      if (input.location.longitude < -180 || input.location.longitude > 180) {
        errors.push('longitude must be between -180 and 180');
      }
    }

    if (input.location.city !== undefined) {
      if (input.location.city.length > CONFIG_CONSTRAINTS.MAX_CITY_LENGTH) {
        errors.push(
          `city must be less than ${CONFIG_CONSTRAINTS.MAX_CITY_LENGTH} characters`
        );
      }
    }
  }

  if (input.preferences?.temperatureUnit !== undefined) {
    if (!(CONFIG_CONSTRAINTS.VALID_TEMP_UNITS as readonly string[]).includes(input.preferences.temperatureUnit)) {
      errors.push(
        `temperatureUnit must be one of: ${CONFIG_CONSTRAINTS.VALID_TEMP_UNITS.join(', ')}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
