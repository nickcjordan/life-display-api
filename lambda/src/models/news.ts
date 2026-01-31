/**
 * News data models for GNews API integration
 */

export interface NewsResponse {
  viewType: 'news';
  articles: NewsArticle[];
  timestamp: string;
}

export interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
}

/**
 * GNews API response types
 */
export interface GNewsApiResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

export interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}
