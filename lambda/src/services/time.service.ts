import { TimeResponse } from '../models/time';
import { logger } from '../utils/logger';

const TIMEZONE = process.env.TIMEZONE || 'America/Chicago';

export class TimeService {
  /**
   * Get current time and date formatted for display
   */
  async getTimeData(): Promise<TimeResponse> {
    try {
      logger.info('Generating time display data', { timezone: TIMEZONE });

      const now = new Date();

      // Determine greeting based on hour
      const hour = parseInt(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: false,
          timeZone: TIMEZONE,
        })
      );

      let greeting: string;
      if (hour < 12) {
        greeting = 'Good morning';
      } else if (hour < 18) {
        greeting = 'Good afternoon';
      } else {
        greeting = 'Good evening';
      }

      const response: TimeResponse = {
        viewType: 'time',
        greeting,
        date: this.formatDate(now),
        dayOfWeek: this.getDayOfWeek(now),
        time: this.formatTime12h(now),
        time24h: this.formatTime24h(now),
        timezone: TIMEZONE,
        timestamp: now.toISOString(),
      };

      logger.info('Time data generated successfully', {
        greeting,
        time: response.time,
      });

      return response;
    } catch (error) {
      logger.error('Error generating time data', error as Error);
      throw error;
    }
  }

  /**
   * Format date as "Wednesday, January 8, 2026"
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  /**
   * Format time as 12-hour with AM/PM
   */
  private formatTime12h(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: TIMEZONE,
    });
  }

  /**
   * Format time as 24-hour
   */
  private formatTime24h(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: TIMEZONE,
    });
  }
}

// Singleton instance
export const timeService = new TimeService();
