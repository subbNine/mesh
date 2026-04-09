import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IUser } from '@mesh/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { ReorderSubtasksDto } from './dto/reorder-subtasks.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { SubtasksService } from './subtasks.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Get('tasks/:taskId/subtasks')
  findAll(
    @Param('taskId') taskId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.subtasksService.findAll(taskId, user.id);
  }

  @Post('tasks/:taskId/subtasks')
  create(
    @Param('taskId') taskId: string,
    @CurrentUser() user: IUser,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.subtasksService.create(taskId, user.id, dto);
  }

  @Patch('subtasks/:subtaskId')
  update(
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: IUser,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.subtasksService.update(subtaskId, user.id, dto);
  }

  @Delete('subtasks/:subtaskId')
  delete(
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.subtasksService.delete(subtaskId, user.id);
  }

  @Patch('tasks/:taskId/subtasks/reorder')
  reorder(
    @Param('taskId') taskId: string,
    @CurrentUser() user: IUser,
    @Body() dto: ReorderSubtasksDto,
  ) {
    return this.subtasksService.reorder(taskId, user.id, dto);
  }
}
