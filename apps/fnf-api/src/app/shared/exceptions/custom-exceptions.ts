import {HttpException, HttpStatus} from '@nestjs/common';

/**
 * Base class for all custom application exceptions
 * Provides consistent error structure and metadata handling
 */
export abstract class BaseCustomException extends HttpException {
  public readonly timestamp: string;
  public readonly context?: string;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    status: HttpStatus,
    context?: string,
    metadata?: Record<string, any>
  ) {
    super(message, status);
    this.timestamp = new Date().toISOString();
    this.context = context;
    this.metadata = metadata;
  }

  /**
   * Get a formatted error object for logging
   */
  getErrorDetails(): Record<string, any> {
    return {
      message: this.message,
      status: this.getStatus(),
      timestamp: this.timestamp,
      context: this.context,
      metadata: this.metadata,
      stack: this.stack
    };
  }
}

/**
 * Exception for file system access errors (file not found, permission denied, etc.)
 */
export class FileSystemAccessException extends BaseCustomException {
  constructor(
    message: string,
    filePath?: string,
    operation?: string,
    originalError?: Error
  ) {
    const metadata = {
      filePath,
      operation,
      originalError: originalError?.message,
      originalStack: originalError?.stack
    };

    super(
      message,
      HttpStatus.BAD_REQUEST,
      'FileSystemAccess',
      metadata
    );
  }

  static fileNotFound(filePath: string): FileSystemAccessException {
    return new FileSystemAccessException(
      `File or directory not found: ${filePath}`,
      filePath,
      'access'
    );
  }

  static permissionDenied(filePath: string): FileSystemAccessException {
    return new FileSystemAccessException(
      `Permission denied accessing: ${filePath}`,
      filePath,
      'access'
    );
  }

  static cannotReadStats(filePath: string, error?: Error): FileSystemAccessException {
    return new FileSystemAccessException(
      `Cannot read file stats: ${filePath}`,
      filePath,
      'stat',
      error
    );
  }
}

/**
 * Exception for directory processing errors
 */
export class DirectoryProcessingException extends BaseCustomException {
  constructor(
    message: string,
    directoryPath?: string,
    operation?: string,
    originalError?: Error
  ) {
    const metadata = {
      directoryPath,
      operation,
      originalError: originalError?.message,
      originalStack: originalError?.stack
    };

    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'DirectoryProcessing',
      metadata
    );
  }

  static cannotReadDirectory(directoryPath: string, error?: Error): DirectoryProcessingException {
    return new DirectoryProcessingException(
      `Cannot read directory contents: ${directoryPath}`,
      directoryPath,
      'readdir',
      error
    );
  }

  static processingFailed(directoryPath: string, error?: Error): DirectoryProcessingException {
    return new DirectoryProcessingException(
      `Directory processing failed: ${directoryPath}`,
      directoryPath,
      'process',
      error
    );
  }
}

/**
 * Exception for file processing errors
 */
export class FileProcessingException extends BaseCustomException {
  constructor(
    message: string,
    filePath?: string,
    operation?: string,
    originalError?: Error
  ) {
    const metadata = {
      filePath,
      operation,
      originalError: originalError?.message,
      originalStack: originalError?.stack
    };

    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'FileProcessing',
      metadata
    );
  }

  static processingFailed(filePath: string, error?: Error): FileProcessingException {
    return new FileProcessingException(
      `File processing failed: ${filePath}`,
      filePath,
      'process',
      error
    );
  }

  static patternMatchingFailed(filePath: string, pattern: string, error?: Error): FileProcessingException {
    return new FileProcessingException(
      `Pattern matching failed for file: ${filePath} with pattern: ${pattern}`,
      filePath,
      'pattern-match',
      error
    );
  }
}

/**
 * Exception for walk operation errors
 */
export class WalkOperationException extends BaseCustomException {
  constructor(
    message: string,
    walkData?: any,
    originalError?: Error
  ) {
    const metadata = {
      walkData,
      originalError: originalError?.message,
      originalStack: originalError?.stack
    };

    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'WalkOperation',
      metadata
    );
  }

  static initializationFailed(error?: Error): WalkOperationException {
    return new WalkOperationException(
      'Walk operation initialization failed',
      undefined,
      error
    );
  }

  static processingInterrupted(error?: Error): WalkOperationException {
    return new WalkOperationException(
      'Walk operation was interrupted',
      undefined,
      error
    );
  }
}