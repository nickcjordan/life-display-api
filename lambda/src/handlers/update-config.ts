import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamoDBService } from '../services/dynamodb.service';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '../utils/response';
import { validateDeviceId, validateUpdateConfig } from '../utils/validation';
import { UpdateDeviceConfigInput } from '../models/device-config';
import { logger } from '../utils/logger';

export async function updateConfigHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const deviceId = event.pathParameters?.deviceId;

  logger.info('PUT /config/{deviceId} request', {
    deviceId,
    sourceIp: event.requestContext.identity.sourceIp,
  });

  if (!deviceId) {
    return badRequestResponse('deviceId is required');
  }

  // Validate deviceId format
  const deviceIdValidation = validateDeviceId(deviceId);
  if (!deviceIdValidation.isValid) {
    return badRequestResponse('Invalid deviceId', {
      errors: deviceIdValidation.errors,
    });
  }

  // Parse and validate request body
  let updates: UpdateDeviceConfigInput;
  try {
    updates = JSON.parse(event.body || '{}');
  } catch (error) {
    return badRequestResponse('Invalid JSON in request body');
  }

  const configValidation = validateUpdateConfig(updates);
  if (!configValidation.isValid) {
    return badRequestResponse('Invalid configuration', {
      errors: configValidation.errors,
    });
  }

  try {
    const updatedConfig = await dynamoDBService.updateDeviceConfig(
      deviceId,
      updates
    );

    logger.info('Config updated successfully', { deviceId });

    return successResponse(
      {
        deviceId,
        message: 'Configuration updated successfully',
        updatedAt: updatedConfig.updatedAt,
      },
      200
    );
  } catch (error) {
    logger.error('Failed to update config', error as Error, { deviceId });

    return errorResponse(
      'Failed to update configuration',
      500,
      { message: (error as Error).message }
    );
  }
}
