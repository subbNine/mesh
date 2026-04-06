import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectFilesController } from './project-files.controller';
import { ProjectFilesService } from './project-files.service';
import { ProjectFile } from './entities/project-files.entity';
import { ProjectFolder } from '../docs/entities/project-folders.entity';
import { ProjectsModule } from '../projects/projects.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectFile, ProjectFolder]),
    ProjectsModule,
    FilesModule,
  ],
  controllers: [ProjectFilesController],
  providers: [ProjectFilesService],
  exports: [ProjectFilesService],
})
export class ProjectFilesModule {}
