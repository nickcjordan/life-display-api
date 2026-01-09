/**
 * Weather data models for OpenWeatherMap API integration
 */

export interface WeatherResponse {
  viewType: 'weather';
  location: string;
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  timestamp: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  time: string; // Current time for small clock display
}

export interface HourlyForecast {
  time: string; // e.g., "2:00 PM"
  hour: number; // 24-hour format for sorting
  temperature: number;
  precipitation: number; // Probability 0-100
  icon: string;
}

export interface DailyForecast {
  date: string; // e.g., "Mon, Jan 8"
  dayOfWeek: string; // e.g., "Monday"
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitation: number; // Probability 0-100
}

/**
 * OpenWeatherMap API response types
 */
export interface OpenWeatherMapResponse {
  lat: number;
  lon: number;
  timezone: string;
  current: {
    dt: number;
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
  };
  hourly: Array<{
    dt: number;
    temp: number;
    pop: number; // Probability of precipitation
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
  daily: Array<{
    dt: number;
    temp: {
      min: number;
      max: number;
    };
    pop: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
}
