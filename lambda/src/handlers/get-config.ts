import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamoDBService } from '../services/dynamodb.service';
import { successResponse, errorResponse, badRequestResponse } from '../utils/response';
import { validateDeviceId } from '../utils/validation';
import { logger } from '../utils/logger';

export async function getConfigHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const deviceId = event.pathParameters?.deviceId;

  logger.info('GET /config/{deviceId} request', {
    deviceId,
    sourceIp: event.requestContext.identity.sourceIp,
  });

  if (!deviceId) {
    return badRequestResponse('deviceId is required');
  }

  // Validate deviceId format
  const validation = validateDeviceId(deviceId);
  if (!validation.isValid) {
    return badRequestResponse('Invalid deviceId', {
      errors: validation.errors,
    });
  }

  try {
    const config = await dynamoDBService.getDeviceConfig(deviceId);

    logger.info('Config fetched successfully', { deviceId });

    return successResponse(config);
  } catch (error) {
    logger.error('Failed to fetch config', error as Error, { deviceId });

    return errorResponse(
      'Failed to fetch configuration',
      500,
      { message: (error as Error).message }
    );
  }
}
