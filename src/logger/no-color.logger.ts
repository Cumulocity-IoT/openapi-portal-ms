import { LoggerService } from '@nestjs/common';

// Simple utility to strip ANSI color codes from strings
const stripAnsi = (input: string) => {
  if (!input) return input;
  return input.replace(/\x1b\[[0-9;]*m/g, '');
};

export class NoColorLogger implements LoggerService {
  log(message: any, context?: string) {
    if (typeof message === 'string') message = stripAnsi(message);
    if (context) {
      console.log(`[LOG] [${context}]`, message);
    } else {
      console.log('[LOG]', message);
    }
  }

  error(message: any, trace?: string, context?: string) {
    if (typeof message === 'string') message = stripAnsi(message);
    if (typeof trace === 'string') trace = stripAnsi(trace);
    if (context) {
      console.error(`[ERROR] [${context}]`, message);
    } else {
      console.error('[ERROR]', message);
    }
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: any, context?: string) {
    if (typeof message === 'string') message = stripAnsi(message);
    if (context) {
      console.warn(`[WARN] [${context}]`, message);
    } else {
      console.warn('[WARN]', message);
    }
  }

  debug?(message: any, context?: string) {
    if (typeof message === 'string') message = stripAnsi(message);
    if (context) {
      console.debug(`[DEBUG] [${context}]`, message);
    } else {
      console.debug('[DEBUG]', message);
    }
  }

  verbose?(message: any, context?: string) {
    if (typeof message === 'string') message = stripAnsi(message);
    if (context) {
      console.info(`[VERBOSE] [${context}]`, message);
    } else {
      console.info('[VERBOSE]', message);
    }
  }
}
