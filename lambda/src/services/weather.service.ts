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
      pressure: data.current.pressure,
      dewPoint: Math.round(data.current.dew_point),
      uvIndex: Math.round(data.current.uvi * 10) / 10, // Round to 1 decimal
      cloudCoverage: data.current.clouds,
      visibility: data.current.visibility,
      windSpeed: Math.round(data.current.wind_speed),
      windDirection: data.current.wind_deg,
      windGust: Math.round(data.current.wind_gust),
      sunrise: new Date(data.current.sunrise * 1000).toISOString(),
      sunset: new Date(data.current.sunset * 1000).toISOString(),
      time: this.formatTime(now),
    };

    // Hourly forecast (next 12 hours)
    const hourly: HourlyForecast[] = data.hourly.slice(0, 12).map((hour) => {
      const hourDate = new Date(hour.dt * 1000);
      return {
        time: this.formatTime(hourDate),
        timestamp: hourDate.toISOString(),
        hour: hourDate.getHours(),
        temperature: Math.round(hour.temp),
        feelsLike: Math.round(hour.feels_like),
        humidity: hour.humidity,
        precipitationProbability: Math.round(hour.pop * 100),
        rainVolume: hour.rain?.['1h'],
        snowVolume: hour.snow?.['1h'],
        cloudCoverage: hour.clouds,
        windSpeed: Math.round(hour.wind_speed),
        windGust: Math.round(hour.wind_gust),
        condition: hour.weather[0].description,
        icon: this.mapWeatherIcon(hour.weather[0].icon),
      };
    });

    // Daily forecast (all days from OpenWeatherMap - typically 8 days including today)
    const daily: DailyForecast[] = data.daily.map((day) => {
      const dayDate = new Date(day.dt * 1000);
      return {
        date: this.formatDate(dayDate),
        timestamp: dayDate.toISOString(),
        dayOfWeek: this.getDayOfWeek(dayDate),
        summary: day.summary,
        high: Math.round(day.temp.max),
        low: Math.round(day.temp.min),
        condition: day.weather[0].description,
        icon: this.mapWeatherIcon(day.weather[0].icon),
        precipitationProbability: Math.round(day.pop * 100),
        rainVolume: day.rain,
        snowVolume: day.snow,
        humidity: day.humidity,
        windSpeed: Math.round(day.wind_speed),
        windGust: Math.round(day.wind_gust),
        uvIndex: Math.round(day.uvi * 10) / 10,
        sunrise: new Date(day.sunrise * 1000).toISOString(),
        sunset: new Date(day.sunset * 1000).toISOString(),
        moonrise: new Date(day.moonrise * 1000).toISOString(),
        moonset: new Date(day.moonset * 1000).toISOString(),
        moonPhase: day.moon_phase,
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
