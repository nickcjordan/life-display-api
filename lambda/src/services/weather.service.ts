import { WeatherResponse, OpenWeatherMapResponse, HourlyForecast, DailyForecast, CurrentWeather } from '../models/weather';
import { logger } from '../utils/logger';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const LATITUDE = process.env.LATITUDE || '33.0198';
const LONGITUDE = process.env.LONGITUDE || '-96.6989';
const LOCATION_NAME = process.env.LOCATION_NAME || 'Plano, TX';
const TIMEZONE = process.env.TIMEZONE || 'America/Chicago';

export class WeatherService {
  /**
   * Fetch weather data from OpenWeatherMap and format for ESP32 display
   */
  async getWeatherData(): Promise<WeatherResponse> {
    try {
      if (!OPENWEATHER_API_KEY) {
        throw new Error('OPENWEATHER_API_KEY environment variable not set');
      }

      logger.info('Fetching weather data', {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        location: LOCATION_NAME,
      });

      // OpenWeatherMap One Call API 3.0
      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${LATITUDE}&lon=${LONGITUDE}&exclude=minutely,alerts&units=imperial&appid=${OPENWEATHER_API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('OpenWeatherMap API error', new Error(errorText), {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenWeatherMapResponse;

      logger.info('Weather data fetched successfully', {
        currentTemp: data.current.temp,
        timezone: data.timezone,
      });

      return this.formatWeatherData(data);
    } catch (error) {
      logger.error('Error fetching weather data', error as Error);
      throw error;
    }
  }

  /**
   * Transform OpenWeatherMap data to ESP32-friendly format
   */
  private formatWeatherData(data: OpenWeatherMapResponse): WeatherResponse {
    const now = new Date();

    // Current weather
    const current: CurrentWeather = {
      temperature: Math.round(data.current.temp),
      feelsLike: Math.round(data.current.feels_like),
      condition: data.current.weather[0].description,
      icon: this.mapWeatherIcon(data.current.weather[0].icon),
      humidity: data.current.humidity,
      windSpeed: Math.round(data.current.wind_speed),
      time: this.formatTime(now),
    };

    // Hourly forecast (next 12 hours)
    const hourly: HourlyForecast[] = data.hourly.slice(0, 12).map((hour) => {
      const hourDate = new Date(hour.dt * 1000);
      return {
        time: this.formatTime(hourDate),
        hour: hourDate.getHours(),
        temperature: Math.round(hour.temp),
        precipitation: Math.round(hour.pop * 100),
        icon: this.mapWeatherIcon(hour.weather[0].icon),
      };
    });

    // Daily forecast (next 7 days)
    const daily: DailyForecast[] = data.daily.slice(0, 7).map((day) => {
      const dayDate = new Date(day.dt * 1000);
      return {
        date: this.formatDate(dayDate),
        dayOfWeek: this.getDayOfWeek(dayDate),
        high: Math.round(day.temp.max),
        low: Math.round(day.temp.min),
        condition: day.weather[0].description,
        icon: this.mapWeatherIcon(day.weather[0].icon),
        precipitation: Math.round(day.pop * 100),
      };
    });

    return {
      viewType: 'weather',
      location: LOCATION_NAME,
      timezone: TIMEZONE,
      current,
      hourly,
      daily,
      timestamp: now.toISOString(),
    };
  }

  /**
   * Map OpenWeatherMap icon codes to simplified icon names for ESP32
   */
  private mapWeatherIcon(owmIcon: string): string {
    // OpenWeatherMap icon format: "01d" = clear day, "01n" = clear night
    const iconMap: Record<string, string> = {
      '01d': 'clear-day',
      '01n': 'clear-night',
      '02d': 'partly-cloudy-day',
      '02n': 'partly-cloudy-night',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rain',
      '09n': 'rain',
      '10d': 'rain',
      '10n': 'rain',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'fog',
      '50n': 'fog',
    };

    return iconMap[owmIcon] || 'unknown';
  }

  /**
   * Format time as 12-hour with AM/PM
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: TIMEZONE,
    });
  }

  /**
   * Format date as "Mon, Jan 8"
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: TIMEZONE,
    });
  }

  /**
   * Get day of week name
   */
  private getDayOfWeek(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: TIMEZONE,
    });
  }
}

// Singleton instance
export const weatherService = new WeatherService();
