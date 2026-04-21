import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { ExcludeWorkspaceMemberDto } from './dto/exclude-workspace-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '@mesh/shared';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('workspaces/:workspaceId/projects')
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: IUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(workspaceId, user.id, dto);
  }

  @Get('workspaces/:workspaceId/projects')
  findAll(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.projectsService.findAll(workspaceId, user.id);
  }

  @Get('projects/:projectId')
  findOne(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.projectsService.findOne(projectId, user.id);
  }

  @Get('projects/:projectId/stats')
  getStats(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.projectsService.getStats(projectId, user.id);
  }

  @Patch('projects/:projectId')
  update(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(projectId, user.id, dto);
  }

  @Delete('projects/:projectId')
  delete(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.projectsService.delete(projectId, user.id);
  }

  @Get('projects/:projectId/members')
  getMembers(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.projectsService.getMembers(projectId, user.id);
  }

  @Post('projects/:projectId/members')
  addMember(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(projectId, user.id, dto);
  }

  @Delete('projects/:projectId/members/:userId')
  removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.projectsService.removeMember(projectId, user.id, targetUserId);
  }

  @Post('projects/:projectId/exclusions')
  excludeWorkspaceMember(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
    @Body() dto: ExcludeWorkspaceMemberDto,
  ) {
    return this.projectsService.excludeWorkspaceMember(projectId, user.id, dto);
  }

  @Delete('projects/:projectId/exclusions/:userId')
  removeExclusion(
    @Param('projectId') projectId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.projectsService.removeExclusion(projectId, user.id, targetUserId);
  }

  @Post('projects/:projectId/public-link')
  generatePublicLink(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.projectsService.generatePublicLink(projectId, user.id);
  }

  @Delete('projects/:projectId/public-link')
  revokePublicLink(
    @Param('projectId') projectId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.projectsService.revokePublicLink(projectId, user.id);
  }
}

