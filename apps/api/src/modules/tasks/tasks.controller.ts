import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BaseQueryDto } from '../../common/dtos/base-query.dto';
import { IUser } from '@mesh/shared';
import { UpdateTaskAssigneesDto } from './dto/update-task-assignees.dto';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @UseGuards(JwtAuthGuard)
  @Post('projects/:projectId/tasks')
  create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('projects/:projectId/tasks')
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
    @Query() query: BaseQueryDto,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.tasksService.findAll(projectId, user.id, { ...query, status, assigneeId });
  }

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId')
  findOne(@Param('taskId') taskId: string, @CurrentUser() user: IUser) {
    return this.tasksService.findOne(taskId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('tasks/:taskId')
  update(
    @Param('taskId') taskId: string,
    @CurrentUser() user: IUser,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(taskId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tasks/:taskId/assignees')
  addAssignee(
    @Param('taskId') taskId: string,
    @CurrentUser() user: IUser,
    @Body() dto: UpdateTaskAssigneesDto,
  ) {
    return this.tasksService.addAssignee(taskId, user.id, dto.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('tasks/:taskId/assignees/:userId')
  removeAssignee(
    @Param('taskId') taskId: string,
    @Param('userId') assigneeUserId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.tasksService.removeAssignee(taskId, user.id, assigneeUserId);
  }

  @Patch('tasks/:taskId/snapshot')
  updateSnapshot(
    @Param('taskId') taskId: string,
    @Body('snapshotUrl') snapshotUrl: string,
  ) {
    return this.tasksService.updateSnapshot(taskId, snapshotUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('tasks/:taskId')
  remove(@Param('taskId') taskId: string, @CurrentUser() user: IUser) {
    return this.tasksService.delete(taskId, user.id);
  }
}
