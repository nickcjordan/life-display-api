import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { weatherHandler } from './handlers/weather';
import { timeHandler } from './handlers/time';
import { corsPreflightResponse, errorResponse } from './utils/response';
import { logger } from './utils/logger';

/**
 * Main Lambda handler - routes requests to appropriate handlers
 */
export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  logger.info('Lambda invocation', {
    requestId: context.awsRequestId,
    httpMethod: event.httpMethod,
    path: event.path,
    resource: event.resource,
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse();
  }

  // Route to handlers based on path and method
  try {
    // GET /weather
    if (event.httpMethod === 'GET' && event.resource === '/weather') {
      return await weatherHandler(event);
    }

    // GET /time
    if (event.httpMethod === 'GET' && event.resource === '/time') {
      return await timeHandler(event);
    }

    // Method/path not supported
    logger.warn('Unsupported method or path', {
      method: event.httpMethod,
      path: event.path,
      resource: event.resource,
    });

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    logger.error('Unhandled error in Lambda handler', error as Error, {
      requestId: context.awsRequestId,
    });

    return errorResponse(
      'Internal server error',
      500,
      { message: (error as Error).message }
    );
  }
}
