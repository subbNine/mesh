import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '@mesh/shared';

@Controller()
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('workspaces/:workspaceId/activity')
  getWorkspaceActivity(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: IUser,
    @Query() query: Record<string, string | string[] | undefined>,
  ) {
    return this.activityService.getWorkspaceActivity(user.id, workspaceId, query);
  }

  @Get('tasks/:taskId/activity')
  getTaskActivity(
    @Param('taskId') taskId: string,
    @CurrentUser() user: IUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityService.getTaskActivity(user.id, taskId, { page, limit });
  }
}
