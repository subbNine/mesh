import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

import { User } from '../users/entities/users.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IUser } from '@mesh/shared';
import { InvitationsService } from './invitations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { ResendEmailVerificationDto } from './dto/resend-email-verification.dto';

type AuthenticatedResponse = {
  user: IUser;
  accessToken: string;
  redirectTo?: string | null;
  inviteError?: string | null;
};

type PendingVerificationResponse = {
  requiresEmailVerification: true;
  email: string;
  verificationEmailSent: true;
  message: string;
};

@Injectable()
export class AuthService {
  private readonly verificationCodeExpiryMinutes = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly invitationsService: InvitationsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(dto: RegisterDto): Promise<PendingVerificationResponse> {
    const email = dto.email.trim().toLowerCase();
    const normalizedRequestedUserName = dto.userName?.trim().toLowerCase();

    const existingUsers = await this.userRepository.find({
      where: normalizedRequestedUserName ? [{ email }, { userName: normalizedRequestedUserName }] : [{ email }],
      take: 2,
    });

    if (existingUsers.some((existingUser) => existingUser.email === email)) {
      throw new ConflictException('Email already in use');
    }

    if (normalizedRequestedUserName && existingUsers.some((existingUser) => existingUser.userName === normalizedRequestedUserName)) {
      throw new ConflictException('Username already in use');
    }

    const userName = await this.resolveAvailableUserName(normalizedRequestedUserName, email);
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      userName,
      passwordHash,
      isEmailVerified: false,
      emailVerifiedAt: null,
    });

    await this.userRepository.save(user);

    await this.issueEmailVerificationCode(user);

    return {
      requiresEmailVerification: true,
      email: user.email,
      verificationEmailSent: true,
      message: 'We sent a verification code to your email. Verify it to activate your account.',
    };
  }

  async login(dto: LoginDto): Promise<AuthenticatedResponse | PendingVerificationResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      await this.issueEmailVerificationCode(user);
      return {
        requiresEmailVerification: true,
        email: user.email,
        verificationEmailSent: true,
        message: 'We sent a fresh verification code to your email. Enter it to finish signing in.',
      };
    }

    return this.createAuthenticatedResponse(user, dto.inviteToken);
  }

  async verifyEmailOtp(dto: VerifyEmailOtpDto): Promise<AuthenticatedResponse> {
    const email = dto.email.trim().toLowerCase();
    const code = dto.code.trim();
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid verification request');
    }

    if (user.isEmailVerified) {
      return this.createAuthenticatedResponse(user, dto.inviteToken);
    }

    if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
      throw new BadRequestException('Start email verification again to get a fresh code.');
    }

    if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This verification code has expired. Request a new code.');
    }

    const isMatch = await bcrypt.compare(code, user.emailVerificationCodeHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid verification code');
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationCodeHash = null;
    user.emailVerificationExpiresAt = null;
    user.emailVerificationSentAt = null;
    await this.userRepository.save(user);

    return this.createAuthenticatedResponse(user, dto.inviteToken);
  }

  async resendEmailVerification(dto: ResendEmailVerificationDto): Promise<PendingVerificationResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Account not found for that email address');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('This email is already verified. Sign in to continue.');
    }

    await this.issueEmailVerificationCode(user);

    return {
      requiresEmailVerification: true,
      email: user.email,
      verificationEmailSent: true,
      message: 'A new verification code is on its way to your inbox.',
    };
  }

  async validateUser(userId: string): Promise<IUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Verify your email to activate your account.');
    }
    return this.toSafeUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid current password');

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await this.userRepository.save(user);
  }

  private async createAuthenticatedResponse(user: User, inviteToken?: string): Promise<AuthenticatedResponse> {
    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);

    let redirectTo: string | null = null;
    let inviteError: string | null = null;

    if (inviteToken) {
      try {
        const inviteResult = await this.invitationsService.acceptInvite(inviteToken, {
          id: user.id,
          email: user.email,
        });
        redirectTo = inviteResult.redirectTo;
      } catch (error: any) {
        inviteError = error?.message || 'Invite could not be accepted.';
      }
    }

    return { user: this.toSafeUser(user), accessToken, redirectTo, inviteError };
  }

  private async issueEmailVerificationCode(user: User): Promise<void> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const salt = await bcrypt.genSalt(10);
    user.emailVerificationCodeHash = await bcrypt.hash(code, salt);
    user.emailVerificationExpiresAt = new Date(Date.now() + this.verificationCodeExpiryMinutes * 60 * 1000);
    user.emailVerificationSentAt = new Date();
    await this.userRepository.save(user);

    await this.notificationsService.sendEmail({
      recipientEmail: user.email,
      type: 'auth.email_verification',
      subject: 'Verify your Mesh account',
      templateName: 'email-verification-otp',
      data: {
        userName: user.firstName || user.userName || user.email,
        verificationCode: code,
        expiresInMinutes: this.verificationCodeExpiryMinutes,
      },
    });
  }

  private toSafeUser(user: User): IUser {
    const {
      passwordHash: _,
      emailVerificationCodeHash: __,
      emailVerificationExpiresAt: ___,
      emailVerificationSentAt: ____,
      ...result
    } = user;
    return result as unknown as IUser;
  }

  private async resolveAvailableUserName(preferredUserName: string | undefined, email: string): Promise<string> {
    const fallbackBase = email.split('@')[0] || 'meshuser';
    const normalizedBase = (preferredUserName || fallbackBase)
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '')
      .slice(0, 20) || 'meshuser';

    let candidate = normalizedBase;
    let suffix = 1;

    while (await this.userRepository.findOne({ where: { userName: candidate } })) {
      const suffixLabel = `${suffix}`;
      candidate = `${normalizedBase.slice(0, Math.max(3, 20 - suffixLabel.length))}${suffixLabel}`;
      suffix += 1;
    }

    return candidate;
  }
}
