import { LoggerService } from '@nestjs/common';

// Simple utility to strip ANSI color codes from strings
const stripAnsi = (input?: unknown) => {
  if (typeof input !== 'string') return input;
  return input.replace(/\x1b\[[0-9;]*m/g, '');
};

const timestamp = () => new Date().toISOString();

const prefix = (level: string, context?: string) => {
  if (context) return `${timestamp()} [${level}] [${context}]`;
  return `${timestamp()} [${level}]`;
};

export class NoColorLogger implements LoggerService {
  log(message: any, context?: string) {
    console.log(prefix('LOG', context), stripAnsi(message));
  }

  error(message: any, trace?: string, context?: string) {
    if (message) {
      message = stripAnsi(message);
      console.error(prefix('ERROR', context), message);
    }
    if (trace) {
      console.error(stripAnsi(trace));
    }
  }

  warn(message: any, context?: string) {
    if (typeof message === 'string') message = stripAnsi(message);
    console.warn(prefix('WARN', context), message);
  }

  debug(message: any, context?: string) {
    console.debug(prefix('DEBUG', context), stripAnsi(message));
  }

  verbose(message: any, context?: string) {
    console.info(prefix('VERBOSE', context), stripAnsi(message));
  }
}
