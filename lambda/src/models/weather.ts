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
  pressure: number; // Atmospheric pressure in hPa
  dewPoint: number; // Dew point temperature
  uvIndex: number; // UV index (0-11+)
  cloudCoverage: number; // Cloud coverage percentage (0-100)
  visibility: number; // Visibility in meters
  windSpeed: number;
  windDirection: number; // Wind direction in degrees (0-360)
  windGust: number; // Wind gust speed
  sunrise: string; // ISO 8601 timestamp
  sunset: string; // ISO 8601 timestamp
  time: string; // Current time for small clock display
}

export interface HourlyForecast {
  time: string; // e.g., "2:00 PM"
  timestamp: string; // ISO 8601 timestamp
  hour: number; // 24-hour format for sorting
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitationProbability: number; // Probability 0-100 (percentage)
  rainVolume?: number; // Rain volume in mm (if present)
  snowVolume?: number; // Snow volume in mm (if present)
  cloudCoverage: number; // Cloud coverage percentage (0-100)
  windSpeed: number;
  windGust: number;
  condition: string; // Weather description
  icon: string;
}

export interface DailyForecast {
  date: string; // e.g., "Mon, Jan 8"
  timestamp: string; // ISO 8601 timestamp
  dayOfWeek: string; // e.g., "Monday"
  summary: string; // AI-generated daily summary from OpenWeatherMap
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitationProbability: number; // Probability 0-100 (percentage)
  rainVolume?: number; // Rain volume in mm (if present)
  snowVolume?: number; // Snow volume in mm (if present)
  humidity: number;
  windSpeed: number;
  windGust: number;
  uvIndex: number; // UV index (0-11+)
  sunrise: string; // ISO 8601 timestamp
  sunset: string; // ISO 8601 timestamp
  moonrise: string; // ISO 8601 timestamp
  moonset: string; // ISO 8601 timestamp
  moonPhase: number; // 0=new moon, 0.25=first quarter, 0.5=full moon, 0.75=last quarter
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
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
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
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    pop: number; // Probability of precipitation (0-1)
    rain?: {
      '1h': number;
    };
    snow?: {
      '1h': number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
  daily: Array<{
    dt: number;
    sunrise: number;
    sunset: number;
    moonrise: number;
    moonset: number;
    moon_phase: number;
    summary: string;
    temp: {
      day: number;
      min: number;
      max: number;
      night: number;
      eve: number;
      morn: number;
    };
    feels_like: {
      day: number;
      night: number;
      eve: number;
      morn: number;
    };
    pressure: number;
    humidity: number;
    dew_point: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    clouds: number;
    pop: number;
    rain?: number;
    snow?: number;
    uvi: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
}
