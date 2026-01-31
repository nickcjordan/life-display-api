import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { newsService } from '../services/news.service';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

export async function newsHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info('GET /news request', {
    sourceIp: event.requestContext.identity.sourceIp,
  });

  try {
    const newsData = await newsService.getNewsData();

    logger.info('News data returned successfully', {
      articleCount: newsData.articles.length,
    });

    return successResponse(newsData);
  } catch (error) {
    logger.error('Failed to fetch news data', error as Error);

    return errorResponse(
      'Failed to fetch news data',
      500,
      { message: (error as Error).message }
    );
  }
}
