import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IUser } from '@mesh/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateDependencyDto } from './dto/create-dependency.dto';
import { DependenciesService } from './dependencies.service';

@Controller()
export class DependenciesController {
  constructor(private readonly dependenciesService: DependenciesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId/dependencies')
  findForTask(
    @Param('taskId') taskId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.dependenciesService.getForTask(taskId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tasks/:taskId/dependencies')
  create(
    @Param('taskId') taskId: string,
    @CurrentUser() user: IUser,
    @Body() dto: CreateDependencyDto,
  ) {
    return this.dependenciesService.create(taskId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('dependencies/:dependencyId')
  remove(
    @Param('dependencyId') dependencyId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.dependenciesService.remove(dependencyId, user.id);
  }
}
