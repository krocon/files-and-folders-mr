import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {Request, Response} from "express";
import {AppLoggerService} from './shared/logger.service';
import {BaseCustomException} from './shared/exceptions/custom-exceptions';

/**
 * Enhanced global exception filter that handles all exceptions thrown within the application.
 * This filter captures both HTTP and non-HTTP exceptions, logs them appropriately,
 * and transforms them into standardized JSON responses.
 *
 * Features:
 * - Handles custom exceptions with rich metadata
 * - Structured logging with Winston
 * - Differentiated error responses for development vs production
 * - Proper error context and stack trace handling
 *
 * @implements {ExceptionFilter}
 * @example
 * // To use globally in your application:
 * app.useGlobalFilters(new HttpExceptionFilter(loggerService));
 */
@Catch() // Catch all exceptions, not just HttpException
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {

  constructor(private readonly logger: AppLoggerService) {
  }

  /**
   * Catches and processes all exceptions, transforming them into standardized response objects.
   *
   * @param {unknown} exception - The caught exception object
   * @param {ArgumentsHost} host - The execution context host providing access to request and response objects
   * @returns {void} Sends a JSON response with error details
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string;
    let errorResponse: any;

    // Handle different types of exceptions
    if (exception instanceof BaseCustomException) {
      // Handle our custom exceptions with rich metadata
      status = exception.getStatus();
      message = exception.message;

      // Log the full error details
      this.logger.error(
        `Custom Exception: ${message}`,
        exception.stack,
        exception.context
      );

      // Log additional metadata if present
      if (exception.metadata) {
        this.logger.logWithMetadata(
          'error',
          `Exception metadata for: ${message}`,
          exception.metadata,
          exception.context
        );
      }

      errorResponse = {
        statusCode: status,
        message: message,
        timestamp: exception.timestamp,
        path: request.url,
        context: exception.context,
        // Only include metadata in development mode
        ...(process.env.NODE_ENV !== 'production' && {
          metadata: exception.metadata
        })
      };

    } else if (exception instanceof HttpException) {
      // Handle standard NestJS HTTP exceptions
      status = exception.getStatus();
      message = exception.message;

      this.logger.error(
        `HTTP Exception: ${message}`,
        exception.stack,
        'HttpExceptionFilter'
      );

      errorResponse = {
        statusCode: status,
        message: message,
        timestamp: new Date().toISOString(),
        path: request.url
      };

    } else {
      // Handle unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : (exception as Error)?.message || 'Unknown error';

      this.logger.error(
        `Unhandled Exception: ${(exception as Error)?.message || 'Unknown error'}`,
        (exception as Error)?.stack,
        'HttpExceptionFilter'
      );

      errorResponse = {
        statusCode: status,
        message: message,
        timestamp: new Date().toISOString(),
        path: request.url,
        // Include stack trace only in development
        ...(process.env.NODE_ENV !== 'production' && {
          stack: (exception as Error)?.stack
        })
      };
    }

    // Log request details for debugging
    this.logger.logWithMetadata(
      'error',
      `Request failed: ${request.method} ${request.url}`,
      {
        method: request.method,
        url: request.url,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
        statusCode: status
      },
      'HttpExceptionFilter'
    );

    response.status(status).json(errorResponse);
  }
}
