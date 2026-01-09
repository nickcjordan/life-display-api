import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamoDBService } from '../services/dynamodb.service';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

export async function listDevicesHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info('GET /devices request', {
    sourceIp: event.requestContext.identity.sourceIp,
  });

  try {
    const devices = await dynamoDBService.listAllDevices();

    logger.info('Devices listed successfully', { count: devices.length });

    return successResponse({ devices });
  } catch (error) {
    logger.error('Failed to list devices', error as Error);

    return errorResponse(
      'Failed to list devices',
      500,
      { message: (error as Error).message }
    );
  }
}
