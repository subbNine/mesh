import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocsController } from './docs.controller';
import { DocsService } from './docs.service';
import { ProjectDocument } from './entities/project-documents.entity';
import { ProjectFolder } from './entities/project-folders.entity';
import { ProjectFile } from '../project-files/entities/project-files.entity';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectDocument, ProjectFolder, ProjectFile]),
    ProjectsModule,
  ],
  controllers: [DocsController],
  providers: [DocsService],
  exports: [DocsService],
})
export class DocsModule {}
