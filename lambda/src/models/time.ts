/**
 * Time/date display data model
 */

export interface TimeResponse {
  viewType: 'time';
  greeting: string;
  date: string;
  dayOfWeek: string;
  time: string;
  time24h: string;
  timezone: string;
  timestamp: string;
}
