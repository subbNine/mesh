import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUser } from '@mesh/shared';
import { InvitationsService } from './invitations.service';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { ResendEmailVerificationDto } from './dto/resend-email-verification.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailOtpDto) {
    return this.authService.verifyEmailOtp(dto);
  }

  @Post('resend-email-verification')
  resendEmailVerification(@Body() dto: ResendEmailVerificationDto) {
    return this.authService.resendEmailVerification(dto);
  }

  @Get('invitations/preview')
  previewInvite(@Query('inviteId') inviteId: string, @Query('token') token: string) {
    return this.invitationsService.previewInvite(inviteId || token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invitations/accept')
  acceptInvite(@CurrentUser() user: IUser, @Body() dto: AcceptInviteDto) {
    return this.invitationsService.acceptInvite(dto.token, { id: user.id, email: user.email });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: IUser) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: IUser,
    @Body() body: any,
  ) {
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}
