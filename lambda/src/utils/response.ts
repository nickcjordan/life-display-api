import { APIGatewayProxyResult } from 'aws-lambda';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
};

export function successResponse<T>(
  data: T,
  statusCode: number = 200
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
}

export function errorResponse(
  error: string,
  statusCode: number = 500,
  details?: Record<string, any>
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      error,
      ...details,
    }),
  };
}

export function notFoundResponse(
  message: string,
  deviceId?: string
): APIGatewayProxyResult {
  return errorResponse('Not Found', 404, { message, deviceId });
}

export function badRequestResponse(
  message: string,
  details?: Record<string, any>
): APIGatewayProxyResult {
  return errorResponse('Bad Request', 400, { message, ...details });
}

export function corsPreflightResponse(): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: '',
  };
}
