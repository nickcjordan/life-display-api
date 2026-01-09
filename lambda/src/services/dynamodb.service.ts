import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { DeviceConfig, UpdateDeviceConfigInput } from '../models/device-config';
import { DEFAULT_CONFIG } from '../constants/defaults';
import { logger } from '../utils/logger';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

const TABLE_NAME = process.env.TABLE_NAME || 'esp32-device-configs';

export class DynamoDBService {
  /**
   * Get device configuration by deviceId
   * Returns default config if device not found
   */
  async getDeviceConfig(deviceId: string): Promise<DeviceConfig> {
    try {
      logger.debug('Fetching device config', { deviceId, tableName: TABLE_NAME });

      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { deviceId },
        })
      );

      if (!result.Item) {
        logger.info('Device not found, returning default config', { deviceId });
        return {
          deviceId,
          ...DEFAULT_CONFIG,
        };
      }

      // Update lastSeen timestamp asynchronously (don't wait)
      this.updateLastSeen(deviceId).catch((error) => {
        logger.error('Failed to update lastSeen', error as Error, { deviceId });
      });

      return result.Item as DeviceConfig;
    } catch (error) {
      logger.error('Error fetching device config', error as Error, { deviceId });
      throw error;
    }
  }

  /**
   * Update device configuration
   * Creates new device if doesn't exist
   */
  async updateDeviceConfig(
    deviceId: string,
    updates: UpdateDeviceConfigInput
  ): Promise<DeviceConfig> {
    try {
      logger.debug('Updating device config', { deviceId, updates });

      // Fetch existing config to merge with updates
      const existingConfig = await this.getDeviceConfig(deviceId);

      const now = new Date().toISOString();
      const isNewDevice = !existingConfig.createdAt;

      const updatedConfig: DeviceConfig = {
        ...existingConfig,
        ...updates,
        deviceId,
        location: {
          ...existingConfig.location,
          ...updates.location,
        },
        preferences: {
          ...existingConfig.preferences,
          ...updates.preferences,
        },
        updatedAt: now,
        ...(isNewDevice && { createdAt: now }),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: updatedConfig,
        })
      );

      logger.info('Device config updated successfully', {
        deviceId,
        isNewDevice,
      });

      return updatedConfig;
    } catch (error) {
      logger.error('Error updating device config', error as Error, { deviceId });
      throw error;
    }
  }

  /**
   * Update lastSeen timestamp for a device
   */
  private async updateLastSeen(deviceId: string): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { deviceId },
        UpdateExpression: 'SET lastSeen = :now',
        ExpressionAttributeValues: {
          ':now': new Date().toISOString(),
        },
      })
    );
  }

  /**
   * List all devices (admin endpoint)
   */
  async listAllDevices(): Promise<
    Array<{ deviceId: string; lastSeen?: string; currentView: string }>
  > {
    try {
      logger.debug('Listing all devices');

      const result = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          ProjectionExpression: 'deviceId, lastSeen, currentView',
        })
      );

      const devices = (result.Items || []).map((item) => ({
        deviceId: item.deviceId as string,
        lastSeen: item.lastSeen as string | undefined,
        currentView: item.currentView as string,
      }));

      logger.info('Devices listed successfully', { count: devices.length });

      return devices;
    } catch (error) {
      logger.error('Error listing devices', error as Error);
      throw error;
    }
  }
}

// Singleton instance
export const dynamoDBService = new DynamoDBService();
