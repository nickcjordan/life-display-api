import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { timeService } from '../services/time.service';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

export async function timeHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info('GET /time request', {
    sourceIp: event.requestContext.identity.sourceIp,
  });

  try {
    const timeData = await timeService.getTimeData();

    logger.info('Time data returned successfully', {
      greeting: timeData.greeting,
      time: timeData.time,
    });

    return successResponse(timeData);
  } catch (error) {
    logger.error('Failed to generate time data', error as Error);

    return errorResponse(
      'Failed to generate time data',
      500,
      { message: (error as Error).message }
    );
  }
}
