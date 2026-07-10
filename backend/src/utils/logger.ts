import { AsyncLocalStorage } from 'node:async_hooks';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LogContext { correlationId?: string; }
interface LogMetadata { correlationId?: string; [key: string]: unknown; }

const storage = new AsyncLocalStorage<LogContext>();
const service = process.env.SERVICE_NAME || 'blade-backend';
const environment = process.env.NODE_ENV || 'development';

export function withLogContext<T>(context: LogContext, callback: () => T): T {
  return storage.run(context, callback);
}

function write(level: LogLevel, message: string, metadata: LogMetadata = {}): void {
  const correlationId = metadata.correlationId ?? storage.getStore()?.correlationId ?? null;
  const payload = { timestamp: new Date().toISOString(), level, message, service, correlationId, environment, ...metadata };
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(`${JSON.stringify(payload)}
`);
}

export const logger = {
  debug(message: string, metadata: LogMetadata = {}) { if (environment === 'development' || process.env.LOG_LEVEL === 'debug') write('debug', message, metadata); },
  info(message: string, metadata: LogMetadata = {}) { write('info', message, metadata); },
  warn(message: string, metadata: LogMetadata = {}) { write('warn', message, metadata); },
  error(message: string, metadata: LogMetadata = {}) { write('error', message, metadata); },
};
