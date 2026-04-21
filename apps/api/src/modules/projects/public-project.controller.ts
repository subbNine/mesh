import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { TasksService } from '../tasks/tasks.service';
import { CanvasService } from '../canvas/canvas.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '@mesh/shared';
import { BaseQueryDto } from '../../common/dtos/base-query.dto';

/**
 * Public read-only endpoints for shared projects.
 * All routes are accessible without authentication.
 * The OptionalJwtAuthGuard extracts the user if a token is present,
 * allowing the frontend to detect authenticated members.
 */
@Controller('public/projects')
@UseGuards(OptionalJwtAuthGuard)
export class PublicProjectController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly canvasService: CanvasService,
  ) {}

  /**
   * Project summary: details + stats + full member list.
   * If the viewer is authenticated, includes a `isMember` flag.
   */
  @Get(':slug')
  async getProjectSummary(
    @Param('slug') slug: string,
    @CurrentUser() user: IUser | null,
  ) {
    const project = await this.projectsService.findByPublicSlug(slug);

    let isMember = false;
    if (user) {
      try {
        await this.projectsService.checkAccess(project.id, user.id);
        isMember = true;
      } catch {
        isMember = false;
      }
    }

    return {
      ...project,
      isMember,
      viewerWorkspaceId: isMember ? project.workspaceId : undefined,
    };
  }

  /** All tasks for the publicly shared project (paginated). */
  @Get(':slug/tasks')
  async getTasks(
    @Param('slug') slug: string,
    @Query() query: BaseQueryDto,
  ) {
    const project = await this.projectsService.resolvePublicProject(slug);
    return this.tasksService.findAllPublic(project.id, {
      page: query.page,
      perPage: query.perPage,
    });
  }

  /** Single task detail with canvas data for read-only rendering. */
  @Get(':slug/tasks/:taskId')
  async getTask(
    @Param('slug') slug: string,
    @Param('taskId') taskId: string,
  ) {
    const project = await this.projectsService.resolvePublicProject(slug);
    const task = await this.tasksService.findOnePublic(taskId, project.id);

    // Fetch canvas binary for read-only rendering
    const canvasDoc = await this.canvasService.getDoc(taskId);

    return {
      ...task,
      canvasDoc: canvasDoc ? canvasDoc.toString('base64') : null,
    };
  }
}
