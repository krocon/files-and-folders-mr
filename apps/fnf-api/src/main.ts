import {NestFactory} from '@nestjs/core';
import {AppModule} from './app/app.module';
import {AppService} from './app/app.service';
import {HttpExceptionFilter} from './app/http-exception.filter';
import {AppLoggerService} from './app/shared/logger.service';
import * as events from 'events';
import {IoAdapter} from '@nestjs/platform-socket.io';
import {ServerOptions} from 'socket.io';
import * as fs from 'fs-extra';
import {ConfigService} from '@nestjs/config';
// import { Request, Response } from 'express';

// Increase the max listeners to prevent the MaxListenersExceededWarning
// Default is 10, setting to 20 to accommodate the application's needs
events.EventEmitter.defaultMaxListeners = 20;

class SocketIOAdapter extends IoAdapter {
  constructor(private readonly configService: ConfigService, app: any) {
    super(app);
  }
  createIOServer(port: number, options?: ServerOptions): any {
    const originSetting = this.configService.get<string>('WS_CORS_ORIGIN', 'true');
    const methodsCsv = this.configService.get<string>('WS_METHODS', 'GET,POST');
    const credentials = this.configService.get<boolean>('WS_CREDENTIALS', false);

    const corsOrigin = parseCorsOrigin(originSetting);
    const methods = methodsCsv.split(',').map(m => m.trim()).filter(Boolean);

    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: corsOrigin,
        credentials,
        methods
      }
    });
    return server;
  }
}


// OR conditionally import based on NODE_ENV
// const environment = process.env.NODE_ENV === 'production'
//   ? require('./environments/environment.prod').environment
//   : require('./environments/environment').environment;


function parseCorsOrigin(setting: string): any {
  if (!setting) return '*';
  const val = setting.trim();
  if (val === '*') return '*';
  if (val.toLowerCase() === 'true') return true;
  if (val.toLowerCase() === 'false') return false;
  // CSV list
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

async function bootstrap() {
  try {
    // Ensure logs directory exists
    await fs.ensureDir('logs');

    // Create the application
    const app = await NestFactory.create(AppModule);

    // Initialize logger service
    const loggerService = new AppLoggerService();
    app.useLogger(loggerService);

    // Configure application
    const configService = app.get(ConfigService);
    const globalPrefix = configService.get<string>('GLOBAL_PREFIX', 'api');
    app.setGlobalPrefix(globalPrefix);

    const httpCorsOrigin = parseCorsOrigin(configService.get<string>('CORS_ORIGIN', '*'));
    const httpCorsCredentials = configService.get<boolean>('CORS_CREDENTIALS', false);
    app.enableCors({
      origin: httpCorsOrigin,
      credentials: httpCorsCredentials,
    });

    app.useWebSocketAdapter(new SocketIOAdapter(configService, app));

    // Use enhanced exception filter with logger
    app.useGlobalFilters(new HttpExceptionFilter(loggerService));

    const port = configService.get<number>('PORT', 3333);

    await app.listen(port, () => {
      loggerService.log(`Listening at http://localhost:${port}/${globalPrefix}`, 'Bootstrap');
      loggerService.log(`NestJS API is running on port: ${port}`, 'Bootstrap');
      const wsPort = configService.get<number>('WS_PORT', 3334);
      loggerService.log(`WebSocket server configured on port: ${wsPort}`, 'Bootstrap');
    });

    // Log available routes
    const server = app.getHttpServer();
    const router = server._events.request._router;
    const availableRoutes: [] = router.stack
      .map(layer => {
        if (layer.route) {
          return {
            path: layer.route.path,
            method: layer.route.stack[0].method
          };
        }
      })
      .filter(item => item !== undefined);

    AppService.availableRoutes = availableRoutes;
    console.log('Routes:', availableRoutes);
    //loggerService.logWithMetadata('info', 'Application routes registered', { routes: availableRoutes }, 'Bootstrap');

  } catch (error) {
    const loggerService = new AppLoggerService();
    loggerService.error(`Failed to start application: ${error.message}`, error.stack, 'Bootstrap');
    process.exit(1);
  }
}


bootstrap();
