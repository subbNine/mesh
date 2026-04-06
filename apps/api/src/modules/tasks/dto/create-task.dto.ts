import { IsString, IsOptional, MaxLength, MinLength, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { TaskStatus } from '@mesh/shared';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
