import { Module, MiddlewareConsumer, NestModule, RequestMethod, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as express from 'express';
import { CanvasService } from './canvas.service';
import { CanvasController } from './canvas.controller';
import { CanvasDocument } from './entities/canvas_documents.entity';
import { TasksModule } from '../tasks/tasks.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CanvasDocument]),
    forwardRef(() => TasksModule),
    FilesModule,
  ],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService],
})
export class CanvasModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(express.raw({ type: 'application/octet-stream', limit: '20mb' }))
      .forRoutes({ path: 'canvas/:taskId', method: RequestMethod.POST });
  }
}
