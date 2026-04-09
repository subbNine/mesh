import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { User } from '../users/entities/users.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IUser } from '@mesh/shared';
import { InvitationsService } from './invitations.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly invitationsService: InvitationsService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: IUser; accessToken: string; redirectTo?: string | null; inviteError?: string | null }> {
    const email = dto.email.toLowerCase();
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
    });

    await this.userRepository.save(user);

    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);

    let redirectTo: string | null = null;
    let inviteError: string | null = null;

    if (dto.inviteToken) {
      try {
        const inviteResult = await this.invitationsService.acceptInvite(dto.inviteToken, {
          id: user.id,
          email: user.email,
        });
        redirectTo = inviteResult.redirectTo;
      } catch (error: any) {
        inviteError = error?.message || 'Invite could not be accepted.';
      }
    }

    const { passwordHash: _, ...result } = user;
    return { user: result as unknown as IUser, accessToken, redirectTo, inviteError };
  }

  async login(dto: LoginDto): Promise<{ user: IUser; accessToken: string; redirectTo?: string | null; inviteError?: string | null }> {
    const email = dto.email.toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);

    let redirectTo: string | null = null;
    let inviteError: string | null = null;

    if (dto.inviteToken) {
      try {
        const inviteResult = await this.invitationsService.acceptInvite(dto.inviteToken, {
          id: user.id,
          email: user.email,
        });
        redirectTo = inviteResult.redirectTo;
      } catch (error: any) {
        inviteError = error?.message || 'Invite could not be accepted.';
      }
    }

    const { passwordHash: _, ...result } = user;
    return { user: result as unknown as IUser, accessToken, redirectTo, inviteError };
  }

  async validateUser(userId: string): Promise<IUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { passwordHash: _, ...result } = user;
    return result as unknown as IUser;
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
