import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProjectFilesService } from './project-files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '@mesh/shared';
import { UpdateProjectFileDto } from './dto/update-project-file.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProjectFilesController {
  constructor(private readonly projectFilesService: ProjectFilesService) {}

  @Post('projects/:projectId/files')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadFiles(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folderId') folderId?: string,
  ) {
    return this.projectFilesService.upload(projectId, user.id, files, folderId);
  }

  @Patch('projects/:projectId/files/:fileId')
  renameFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: IUser,
    @Body() dto: UpdateProjectFileDto,
  ) {
    return this.projectFilesService.rename(projectId, fileId, user.id, dto);
  }

  @Delete('projects/:projectId/files/:fileId')
  deleteFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.projectFilesService.delete(projectId, fileId, user.id);
  }
}
