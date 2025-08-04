import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app/app.module';
import {AppService} from './app/app.service';
import {HttpExceptionFilter} from './app/http-exception.filter';
import {environment} from './environments/environment';
import * as events from 'events';
import {Server as SocketIOServer} from 'socket.io';

events.EventEmitter.defaultMaxListeners = 20;

async function bootstrap() {

  const frontendPort = environment.frontendPort;
  const backendPort = environment.backendPort;
  const websocketPort = environment.websocketPort || 3334;
  Logger.log('FnF Ports                           :', {websocketPort, backendPort, frontendPort});

  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    origin: 'http://localhost:' + frontendPort, // Passe hier den Frontend-Port an
    credentials: true,
  });
  app.useGlobalFilters(new HttpExceptionFilter());


  const httpServer = await app.listen(backendPort);
  Logger.log(`Listening at                        : http://localhost:${backendPort}/${globalPrefix}`);
  Logger.log('NestJS API is running on port       :', backendPort);
  Logger.log('WebSocket server is running on port :', websocketPort);

  // Socket.IO Setup with CORS
  const io = new SocketIOServer(httpServer.getHttpServer(), {
    cors: {
      origin: 'http://localhost:4200', // Frontend
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    Logger.log('Client connected                    :', socket.id);
    socket.on('disconnect', () => {
      Logger.log('Client disconnected                 :', socket.id);
    });
  });

  // Routen-Logging
  const server = app.getHttpServer();
  const router = server._events.request._router;
  const availableRoutes: [] = router.stack
    .map(layer => {
      if (layer.route) {
        return {
          path: layer.route.path,
          method: layer.route.stack[0].method,
        };
      }
    })
    .filter(item => item !== undefined);
  AppService.availableRoutes = availableRoutes;
  Logger.log('Routes                              :', availableRoutes);
}

bootstrap();
