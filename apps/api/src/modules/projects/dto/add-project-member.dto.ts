import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ProjectMemberRole } from '@mesh/shared';

export class AddProjectMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: keyof typeof ProjectMemberRole | ProjectMemberRole;
}
