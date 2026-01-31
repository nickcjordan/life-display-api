import { NewsResponse, GNewsApiResponse } from '../models/news';
import { logger } from '../utils/logger';

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '';
const NEWS_COUNTRY = process.env.NEWS_COUNTRY || 'us';
const NEWS_LANG = process.env.NEWS_LANG || 'en';
const NEWS_MAX_ARTICLES = 10;

export class NewsService {
  /**
   * Fetch top news headlines from GNews API
   */
  async getNewsData(): Promise<NewsResponse> {
    try {
      if (!GNEWS_API_KEY) {
        throw new Error('GNEWS_API_KEY environment variable not set');
      }

      logger.info('Fetching news data', {
        country: NEWS_COUNTRY,
        lang: NEWS_LANG,
        maxArticles: NEWS_MAX_ARTICLES,
      });

      const url = `https://gnews.io/api/v4/top-headlines?category=general&lang=${NEWS_LANG}&country=${NEWS_COUNTRY}&max=${NEWS_MAX_ARTICLES}&apikey=${GNEWS_API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text(); 
        logger.error('GNews API error', new Error(errorText), {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`GNews API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as GNewsApiResponse;

      logger.info('News data fetched successfully', {
        totalArticles: data.totalArticles,
        returnedArticles: data.articles.length,
      });

      return this.formatNewsData(data);
    } catch (error) {
      logger.error('Error fetching news data', error as Error);
      throw error;
    }
  }

  /**
   * Transform GNews data to client-friendly format
   */
  private formatNewsData(data: GNewsApiResponse): NewsResponse {
    const articles = data.articles.map((article) => ({
      title: article.title,
      description: article.description || '',
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
    }));

    return {
      viewType: 'news',
      articles,
      timestamp: new Date().toISOString(),
    };
  }
}

// Singleton instance
export const newsService = new NewsService();
