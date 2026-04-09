import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProjectMemberRole } from '@mesh/shared';

export class AddProjectMemberDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() || undefined : value)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() || undefined : value)
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: keyof typeof ProjectMemberRole | ProjectMemberRole;
}
