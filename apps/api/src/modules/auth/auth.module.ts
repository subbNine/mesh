import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/users.entity';
import { InvitationsService } from './invitations.service';
import { Workspace } from '../workspaces/entities/workspaces.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';
import { Project } from '../projects/entities/projects.entity';
import { ProjectMember } from '../projects/entities/project_members.entity';
import { Invitation } from './entities/invitation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Workspace, WorkspaceMember, Project, ProjectMember, Invitation]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '7d') as `${number}${'s' | 'm' | 'h' | 'd'}` },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, InvitationsService],
  exports: [JwtModule, InvitationsService],
})
export class AuthModule { }
