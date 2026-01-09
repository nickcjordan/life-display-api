import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { weatherService } from '../services/weather.service';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

export async function weatherHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info('GET /weather request', {
    sourceIp: event.requestContext.identity.sourceIp,
  });

  try {
    const weatherData = await weatherService.getWeatherData();

    logger.info('Weather data returned successfully', {
      currentTemp: weatherData.current.temperature,
      location: weatherData.location,
    });

    return successResponse(weatherData);
  } catch (error) {
    logger.error('Failed to fetch weather data', error as Error);

    return errorResponse(
      'Failed to fetch weather data',
      500,
      { message: (error as Error).message }
    );
  }
}
