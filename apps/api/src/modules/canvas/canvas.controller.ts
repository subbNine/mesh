import { Controller, Get, Post, Param, Req, Res, UseGuards, HttpException, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { CanvasService } from './canvas.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('canvas')
@UseGuards(JwtAuthGuard)
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) { }

  @Get(':taskId')
  async getDoc(@Param('taskId') taskId: string, @Res() res: Response) {
    const doc = await this.canvasService.getDoc(taskId);
    if (!doc) {
      throw new HttpException('Canvas document not found', HttpStatus.NOT_FOUND);
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(doc);
  }

  @Post(':taskId')
  async saveDoc(@Param('taskId') taskId: string, @Req() req: Request) {
    if (!Buffer.isBuffer(req.body)) {
      throw new HttpException('Expected raw binary body', HttpStatus.BAD_REQUEST);
    }
    await this.canvasService.saveDoc(taskId, req.body);
    return { success: true };
  }

  @Post(':taskId/snapshot')
  @UseInterceptors(FileInterceptor('file'))
  async generateAndSaveSnapshot(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) {
      throw new HttpException('file is required', HttpStatus.BAD_REQUEST);
    }
    const url = await this.canvasService.generateAndSaveSnapshot(taskId, file.buffer);
    return { success: true, url };
  }
}
