import { Controller, Get, Patch, Post, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from '@mesh/shared';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: IUser) {
    const fullUser = await this.usersService.findMe(user.id);
    const { passwordHash, ...result } = fullUser;
    return result;
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: IUser, @Body() dto: UpdateUserDto) {
    try {
      const updated = await this.usersService.updateMe(user.id, dto);
      const { passwordHash, ...result } = updated;
      return result;
    } catch (err) {
      console.error('Profile update error:', err);
      throw err;
    }
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async updateAvatar(@CurrentUser() user: IUser, @UploadedFile() file: Express.Multer.File) {
    try {
      const updated = await this.usersService.updateAvatar(user.id, file);
      const { passwordHash, ...result } = updated;
      return result;
    } catch (err) {
      console.error('Avatar upload error:', err);
      throw err;
    }
  }
}
