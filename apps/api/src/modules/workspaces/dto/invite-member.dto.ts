import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { WorkspaceMemberRole } from '@mesh/shared';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(WorkspaceMemberRole)
  role?: keyof typeof WorkspaceMemberRole | WorkspaceMemberRole;
}
