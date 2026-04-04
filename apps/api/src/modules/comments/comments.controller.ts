import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @Get('tasks/:taskId/comments')
  findAll(@Param('taskId') taskId: string, @Request() req: any) {
    return this.commentsService.findAll(taskId, req.user.id);
  }

  @Post('comments')
  create(@Body() dto: CreateCommentDto, @Request() req: any) {
    return this.commentsService.create(req.user.id, dto);
  }

  @Post('comments/:commentId/replies')
  createReply(@Param('commentId') commentId: string, @Body() dto: CreateReplyDto, @Request() req: any) {
    return this.commentsService.createReply(commentId, req.user.id, dto);
  }

  @Patch('comments/:commentId/resolve')
  resolve(@Param('commentId') commentId: string, @Request() req: any) {
    return this.commentsService.resolve(commentId, req.user.id);
  }

  @Patch('comments/:commentId/unresolve')
  unresolve(@Param('commentId') commentId: string, @Request() req: any) {
    return this.commentsService.unresolve(commentId, req.user.id);
  }

  @Delete('comments/:commentId')
  delete(@Param('commentId') commentId: string, @Request() req: any) {
    return this.commentsService.delete(commentId, req.user.id);
  }
}
