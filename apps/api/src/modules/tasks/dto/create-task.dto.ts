import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
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
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  assigneeIds?: string[];

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
