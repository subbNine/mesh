import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Req() req: Request) {
    return this.notificationsService.findAll((req.user as any).id);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: Request) {
    const count = await this.notificationsService.getUnreadCount((req.user as any).id);
    return { count };
  }

  @Patch('read-all')
  async markAllRead(@Req() req: Request) {
    await this.notificationsService.markAllRead((req.user as any).id);
    return { success: true };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req: Request) {
    await this.notificationsService.markRead(id, (req.user as any).id);
    return { success: true };
  }
}
