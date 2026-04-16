import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '@mesh/shared';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@CurrentUser() user: IUser, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(user.id, createWorkspaceDto);
  }

  @Get()
  findAllForUser(@CurrentUser() user: IUser) {
    return this.workspacesService.findAllForUser(user.id);
  }

  @Get(':workspaceId')
  findOne(@Param('workspaceId') workspaceId: string, @CurrentUser() user: IUser) {
    return this.workspacesService.findOne(workspaceId, user.id);
  }

  @Patch(':workspaceId')
  update(
    @Param('workspaceId') workspaceId: string, 
    @CurrentUser() user: IUser, 
    @Body() updateWorkspaceDto: UpdateWorkspaceDto
  ) {
    return this.workspacesService.update(workspaceId, user.id, updateWorkspaceDto);
  }

  @Delete(':workspaceId')
  remove(@Param('workspaceId') workspaceId: string, @CurrentUser() user: IUser) {
    return this.workspacesService.delete(workspaceId, user.id);
  }

  @Get(':workspaceId/members')
  getMembers(@Param('workspaceId') workspaceId: string, @CurrentUser() user: IUser) {
    return this.workspacesService.getMembers(workspaceId, user.id);
  }

  @Post(':workspaceId/members/invite')
  inviteMember(
    @Param('workspaceId') workspaceId: string, 
    @CurrentUser() user: IUser, 
    @Body() inviteMemberDto: InviteMemberDto
  ) {
    return this.workspacesService.inviteMember(workspaceId, user.id, inviteMemberDto);
  }

  @Delete(':workspaceId/members/:userId')
  removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.workspacesService.removeMember(workspaceId, user.id, targetUserId);
  }

  @Get(':workspaceId/members/:userId')
  getMemberProfile(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: IUser,
  ) {
    return this.workspacesService.getMemberProfile(workspaceId, user.id, targetUserId);
  }
}

