import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ISearchResult } from '@mesh/shared';

@Controller('workspaces/:workspaceId/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Param('workspaceId') workspaceId: string,
    @Request() req: any,
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
  ): Promise<ISearchResult[]> {
    return this.searchService.search(workspaceId, req.user.id, query, {
      type,
      projectId,
      status,
      assigneeId,
    });
  }
}
