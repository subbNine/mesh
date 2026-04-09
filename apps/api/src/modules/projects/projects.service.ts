import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/projects.entity';
import { ProjectMember } from './entities/project_members.entity';
import { ProjectExclusion } from './entities/project_exclusions.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';
import { Task } from '../tasks/entities/tasks.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { ExcludeWorkspaceMemberDto } from './dto/exclude-workspace-member.dto';
import { ActivityService } from '../activity/activity.service';
import { ProjectMemberRole } from '@mesh/shared';
import { InvitationsService } from '../auth/invitations.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(ProjectExclusion)
    private readonly projectExclusionRepo: Repository<ProjectExclusion>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepo: Repository<WorkspaceMember>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly activityService: ActivityService,
    private readonly invitationsService: InvitationsService,
  ) {}

  /**
   * Internal common method evaluating structural bounds natively matching PRD.
   * Admin roles are required for destructive behaviors.
   */
  async checkAccess(projectId: string, userId: string): Promise<{ project: Project, role: string }> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const workspaceId = project.workspaceId;

    const projectMember = await this.projectMemberRepo.findOne({ where: { projectId, userId } });

    if (projectMember) {
      return { project, role: projectMember.role };
    }

    const workspaceMember = await this.workspaceMemberRepo.findOne({ where: { workspaceId, userId } });
    if (!workspaceMember) {
      throw new ForbiddenException('You have no access to this project workspace');
    }

    const exclusion = await this.projectExclusionRepo.findOne({ where: { projectId, userId } });
    if (exclusion) {
      throw new ForbiddenException('You have been explicitly excluded from this project');
    }

    // Default to 'member' if they have access via workspace and aren't explicitly assigned
    return { project, role: ProjectMemberRole.Member };
  }

  async create(workspaceId: string, userId: string, dto: CreateProjectDto): Promise<Project> {
    const isWpMember = await this.workspaceMemberRepo.findOne({ where: { workspaceId, userId } });
    if (!isWpMember) throw new ForbiddenException('Must be a workspace member to create projects');

    const project = this.projectRepo.create({
      ...dto,
      workspaceId,
      createdBy: userId,
    });
    
    const saved = await this.projectRepo.save(project);

    const pm = this.projectMemberRepo.create({
      projectId: saved.id,
      userId,
      role: ProjectMemberRole.Admin,
    });
    await this.projectMemberRepo.save(pm);

    await this.activityService.recordProjectCreated(saved, userId)
      .catch((error) => console.error('Failed to record project.created activity event', error));

    return saved;
  }

  async findAll(workspaceId: string, userId: string): Promise<any[]> {
    const isWpMember = await this.workspaceMemberRepo.findOne({ where: { workspaceId, userId } });
    
    let projects;
    if (isWpMember) {
      // Find all projects in workspace, EXCLUDING ones where user is entirely excluded AND not explicitly added
      const allProjects = await this.projectRepo.find({ where: { workspaceId } });
      const exclusions = await this.projectExclusionRepo.find({ where: { userId } });
      const excludedProjectIds = new Set(exclusions.map(e => e.projectId));
      
      const explicitMemberships = await this.projectMemberRepo.find({ where: { userId } });
      const explicitMemberProjectIds = new Set(explicitMemberships.map(m => m.projectId));

      projects = allProjects.filter(p => !excludedProjectIds.has(p.id) || explicitMemberProjectIds.has(p.id));
    } else {
      // Only explicit accesses if not a workspace member
      const explicitMemberships = await this.projectMemberRepo.find({ where: { userId } });
      const explicitProjectIds = explicitMemberships.map(m => m.projectId);
      if (explicitProjectIds.length === 0) return [];
      
      projects = await this.projectRepo.createQueryBuilder('project')
        .where('project.id IN (:...ids)', { ids: explicitProjectIds })
        .andWhere('project.workspaceId = :workspaceId', { workspaceId })
        .getMany();
    }

    // Append statistics logic calculating bounds
    return Promise.all(
      projects.map(async (project) => {
        const taskCount = await this.taskRepo.count({ where: { projectId: project.id } });
        const memberCount = await this.projectMemberRepo.count({ where: { projectId: project.id } });
        
        const previewMembers = await this.projectMemberRepo.find({
          where: { projectId: project.id },
          relations: ['user'],
          take: 5
        });

        return { ...project, taskCount, memberCount, previewMembers };
      })
    );
  }

  async findOne(projectId: string, userId: string): Promise<Project> {
    const { project } = await this.checkAccess(projectId, userId);
    return project;
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto): Promise<Project> {
    const { project, role } = await this.checkAccess(projectId, userId);
    if (role !== ProjectMemberRole.Admin) throw new ForbiddenException('Only project admins can update Settings');
    
    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description;

    return this.projectRepo.save(project);
  }

  async delete(projectId: string, userId: string): Promise<void> {
    const { project, role } = await this.checkAccess(projectId, userId);
    if (role !== ProjectMemberRole.Admin) throw new ForbiddenException('Only project admins can delete');

    // Dependencies cascade mapped in entity natively via onDelete: 'CASCADE'
    await this.projectRepo.remove(project);
  }

  async addMember(projectId: string, requesterId: string, dto: AddProjectMemberDto): Promise<ProjectMember | Record<string, unknown>> {
    const { project, role } = await this.checkAccess(projectId, requesterId);
    if (role !== ProjectMemberRole.Admin) throw new ForbiddenException('Only project admins can alter member bindings');

    if (dto.email) {
      return this.invitationsService.createProjectInvite(
        projectId,
        requesterId,
        dto.email,
        dto.role || ProjectMemberRole.Member,
      );
    }

    if (!dto.userId) {
      throw new BadRequestException('Provide a userId or email to add someone to this project.');
    }

    const existing = await this.projectMemberRepo.findOne({ where: { projectId, userId: dto.userId } });
    if (existing) throw new ConflictException('User is already configured implicitly inside member table');

    // Remove exclusion if exists
    const exclusion = await this.projectExclusionRepo.findOne({ where: { projectId, userId: dto.userId } });
    if (exclusion) await this.projectExclusionRepo.remove(exclusion);

    const pm = this.projectMemberRepo.create({
      projectId,
      userId: dto.userId,
      role: dto.role || ProjectMemberRole.Member,
    });

    const saved = await this.projectMemberRepo.save(pm);
    const result = await this.projectMemberRepo.findOne({ where: { id: saved.id }, relations: ['user'] });
    if (!result) throw new NotFoundException('Failed to verify implicitly populated member binding');

    await this.activityService.recordMemberAdded(project, requesterId, dto.userId)
      .catch((error) => console.error('Failed to record member.added activity event', error));

    return result;
  }

  async removeMember(projectId: string, requesterId: string, targetUserId: string): Promise<void> {
    const { role } = await this.checkAccess(projectId, requesterId);
    if (role !== ProjectMemberRole.Admin) throw new ForbiddenException('Only project admins can remove');

    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId: targetUserId } });
    if (!pm) throw new NotFoundException('Project member mapping not found natively');

    await this.projectMemberRepo.remove(pm);
  }

  async excludeWorkspaceMember(projectId: string, requesterId: string, dto: ExcludeWorkspaceMemberDto): Promise<ProjectExclusion> {
    const { project, role } = await this.checkAccess(projectId, requesterId);
    if (role !== ProjectMemberRole.Admin) throw new ForbiddenException('Only project admins can establish exclusion borders');

    const wpMember = await this.workspaceMemberRepo.findOne({ where: { workspaceId: project.workspaceId, userId: dto.userId } });
    if (!wpMember) throw new ConflictException('User is not mapped to this workspace natively');

    const existing = await this.projectExclusionRepo.findOne({ where: { projectId, userId: dto.userId } });
    if (existing) throw new ConflictException('User is already excluded');

    // Remove explicit member access entirely mapping strictly to exclusions
    const pm = await this.projectMemberRepo.findOne({ where: { projectId, userId: dto.userId } });
    if (pm) await this.projectMemberRepo.remove(pm);

    const exclusion = this.projectExclusionRepo.create({
      projectId,
      userId: dto.userId,
    });
    
    const saved = await this.projectExclusionRepo.save(exclusion);
    const result = await this.projectExclusionRepo.findOne({ where: { id: saved.id }, relations: ['user'] });
    if (!result) throw new NotFoundException('Failure isolating explicit exclusionary bounds');
    return result;
  }

  async removeExclusion(projectId: string, requesterId: string, userId: string): Promise<void> {
    const { role } = await this.checkAccess(projectId, requesterId);
    if (role !== ProjectMemberRole.Admin) throw new ForbiddenException('Only project admins can repeal exclusions');

    const exclusion = await this.projectExclusionRepo.findOne({ where: { projectId, userId } });
    if (!exclusion) throw new NotFoundException('Mapping not detected in exclusion boundaries');

    await this.projectExclusionRepo.remove(exclusion);
  }

  async getMembers(projectId: string, userId: string): Promise<{ active: any[], excluded: any[] }> {
    await this.checkAccess(projectId, userId);

    const explicit = await this.projectMemberRepo.find({ where: { projectId }, relations: ['user'] });
    const excluded = await this.projectExclusionRepo.find({ where: { projectId }, relations: ['user'] });

    return {
      active: explicit,
      excluded: excluded,
    };
  }
}

