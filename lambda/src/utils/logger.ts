type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

export const logger = {
  debug: (message: string, meta?: Record<string, any>) => {
    if (shouldLog('debug')) {
      console.log(JSON.stringify({ level: 'DEBUG', message, ...meta }));
    }
  },

  info: (message: string, meta?: Record<string, any>) => {
    if (shouldLog('info')) {
      console.log(JSON.stringify({ level: 'INFO', message, ...meta }));
    }
  },

  warn: (message: string, meta?: Record<string, any>) => {
    if (shouldLog('warn')) {
      console.warn(JSON.stringify({ level: 'WARN', message, ...meta }));
    }
  },

  error: (message: string, error?: Error, meta?: Record<string, any>) => {
    if (shouldLog('error')) {
      console.error(JSON.stringify({
        level: 'ERROR',
        message,
        error: error?.message,
        stack: error?.stack,
        ...meta,
      }));
    }
  },
};
