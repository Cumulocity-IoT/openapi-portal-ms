import { LoggerService } from '@nestjs/common';

// Simple utility to strip ANSI color codes from strings
const stripAnsi = (input: string) => {
  if (!input) return input;
  return input.replace(/\x1b\[[0-9;]*m/g, '');
};

const timestamp = () => new Date().toISOString();

const prefix = (level: string, context?: string) => {
  if (context) return `${timestamp()} [${level}] [${context}]`;
  return `${timestamp()} [${level}]`;
};

export class NoColorLogger implements LoggerService {
  log(message: any, context?: string) {
    if (typeof message === 'string') message = stripAnsi(message);
    console.log(prefix('LOG', context), message);
  }

  error(message: any, trace?: string, context?: string) {
    if (typeof message === 'string') message = stripAnsi(message);
    if (typeof trace === 'string') trace = stripAnsi(trace);
    console.error(prefix('ERROR', context), message);
    if (trace) {
      console.error(timestamp(), stripAnsi(trace));
    }
  }

  warn(message: any, context?: string) {
    if (typeof message === 'string') message = stripAnsi(message);
    console.warn(prefix('WARN', context), message);
  }

  debug?(message: any, context?: string) {
    if (typeof message === 'string') message = stripAnsi(message);
    console.debug(prefix('DEBUG', context), message);
  }

  verbose?(message: any, context?: string) {
    if (typeof message === 'string') message = stripAnsi(message);
    console.info(prefix('VERBOSE', context), message);
  }
}
