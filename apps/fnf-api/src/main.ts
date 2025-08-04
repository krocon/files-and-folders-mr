
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app/app.module';
import {AppService} from './app/app.service';
import {HttpExceptionFilter} from './app/http-exception.filter';
import {environment} from './environments/environment';
import * as events from 'events';
import {IoAdapter} from '@nestjs/platform-socket.io';
import {ServerOptions} from 'socket.io';
// import { Request, Response } from 'express';

// Increase the max listeners to prevent the MaxListenersExceededWarning
// Default is 10, setting to 20 to accommodate the application's needs
events.EventEmitter.defaultMaxListeners = 20;

class SocketIOAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: true,
        credentials: false,
        methods: ['GET', 'POST']
      }
    });
    return server;
  }
}


// OR conditionally import based on NODE_ENV
// const environment = process.env.NODE_ENV === 'production'
//   ? require('./environments/environment.prod').environment
//   : require('./environments/environment').environment;


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  //app.enableCors();
  app.enableCors({
    origin: '*',
    credentials: false,
  });
  app.useWebSocketAdapter(new SocketIOAdapter(app));
  app.useGlobalFilters(new HttpExceptionFilter());
  // app.useGlobalPipes(new ValidationPipe())
  const port = process.env.PORT || 3333;

  // app.use('*', (req: Request, res: Response) => {
  //   res.redirect('/');
  // });

  await app.listen(port, () => {
    Logger.log('Listening at http://localhost:' + port + '/' + globalPrefix);
    console.info('NestJS API is running on port:', port);
    console.info('WebSocket server is running on port:', environment.websocketPort);
  });

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

}


bootstrap();
