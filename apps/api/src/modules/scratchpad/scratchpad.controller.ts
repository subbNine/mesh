import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IUser } from '@mesh/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateScratchpadDto } from './dto/update-scratchpad.dto';
import { ScratchpadService } from './scratchpad.service';

@Controller('scratchpad')
@UseGuards(JwtAuthGuard)
export class ScratchpadController {
  constructor(private readonly scratchpadService: ScratchpadService) {}

  @Get('me')
  getMine(@CurrentUser() user: IUser) {
    return this.scratchpadService.getForUser(user.id);
  }

  @Patch('me')
  updateMine(
    @CurrentUser() user: IUser,
    @Body() dto: UpdateScratchpadDto,
  ) {
    return this.scratchpadService.updateForUser(user.id, dto);
  }
}
