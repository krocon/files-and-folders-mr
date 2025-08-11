import {Injectable, LoggerService} from '@nestjs/common';
import {createLogger, format, Logger, transports} from 'winston';

/**
 * Custom logger service using Winston for structured logging
 * Implements NestJS LoggerService interface for consistent logging across the application
 */
@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger(
      {
        level: process.env.LOG_LEVEL || 'info',
        format: format.combine(
          format.timestamp(
            {
              format: 'YYYY-MM-DD HH:mm:ss'
            }
          ),
          format.errors({stack: true}),
          format.printf(({level, message, timestamp, stack, context, ...metadata}) => {
            let msg = `${timestamp} [${level.toUpperCase()}]`;
            if (context) {
              msg += ` [${context}]`;
            }
            msg += ` ${message}`;

            if (stack) {
              msg += `\n${stack}`;
            }

            // Add metadata if present
            const metaStr = Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '';
            if (metaStr) {
              msg += ` ${metaStr}`;
            }

            return msg;
          })),
        transports: [new transports.Console({
          format: format.combine(format.colorize(), format.simple())
        }),
          new transports.File({
            filename: 'logs/error.log', level: 'error', format: format.combine(format.timestamp(), format.json())
          }),
          new transports.File({
            filename: 'logs/combined.log', format: format.combine(format.timestamp(), format.json())
          })
        ],
        exitOnError: false
      }
    );
  }


  log(message: string, context?: string): void {
    this.logger.info(message, {context});
  }

  error(message: string, stack?: string, context?: string): void {
    this.logger.error(message, {context, stack});
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, {context});
  }


  debug(message: string, context?: string): void {
    this.logger.debug(message, {context});
  }


  verbose(message: string, context?: string): void {
    this.logger.verbose(message, {context});
  }


  logWithMetadata(level: string, message: string, metadata: Record<string, any>, context?: string): void {
    this.logger.log(level, message, {...metadata, context});
  }

  /**
   * Get the underlying Winston logger instance
   */
  getWinstonLogger(): Logger {
    return this.logger;
  }
}