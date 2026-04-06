import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DocsService } from './docs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '@mesh/shared';
import { CreateProjectFolderDto } from './dto/create-project-folder.dto';
import { CreateProjectDocumentDto } from './dto/create-project-document.dto';
import { UpdateProjectDocumentDto } from './dto/update-project-document.dto';
import { MoveProjectLibraryItemDto } from './dto/move-project-library-item.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get('projects/:projectId/library')
  getLibrary(@Param('projectId') projectId: string, @CurrentUser() user: IUser) {
    return this.docsService.getLibrary(projectId, user.id);
  }

  @Get('projects/:projectId/library/folders/:folderId')
  getFolderContents(
    @Param('projectId') projectId: string,
    @Param('folderId') folderId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.docsService.getLibrary(projectId, user.id, folderId);
  }

  @Post('projects/:projectId/folders')
  createFolder(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
    @Body() dto: CreateProjectFolderDto,
  ) {
    return this.docsService.createFolder(projectId, user.id, dto);
  }

  @Delete('projects/:projectId/folders/:folderId')
  deleteFolder(
    @Param('projectId') projectId: string,
    @Param('folderId') folderId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.docsService.deleteFolder(projectId, folderId, user.id);
  }

  @Post('projects/:projectId/documents')
  createDocument(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
    @Body() dto: CreateProjectDocumentDto,
  ) {
    return this.docsService.createDocument(projectId, user.id, dto);
  }

  @Get('projects/:projectId/documents/:docId')
  getDocument(
    @Param('projectId') projectId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.docsService.getDocument(projectId, docId, user.id);
  }

  @Patch('projects/:projectId/documents/:docId')
  updateDocument(
    @Param('projectId') projectId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: IUser,
    @Body() dto: UpdateProjectDocumentDto,
  ) {
    return this.docsService.updateDocument(projectId, docId, user.id, dto);
  }

  @Delete('projects/:projectId/documents/:docId')
  deleteDocument(
    @Param('projectId') projectId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.docsService.deleteDocument(projectId, docId, user.id);
  }

  @Patch('projects/:projectId/library/move')
  moveItem(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
    @Body() dto: MoveProjectLibraryItemDto,
  ) {
    return this.docsService.moveItem(projectId, user.id, dto);
  }
}
