import { Controller, Post, Delete, Param, Body, UseInterceptors, UploadedFile, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Body('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    return this.filesService.upload(taskId, req.user.id, file);
  }

  @Delete(':fileId')
  async deleteFile(@Param('fileId') fileId: string, @Req() req: any) {
    return this.filesService.delete(fileId, req.user.id);
  }
}
