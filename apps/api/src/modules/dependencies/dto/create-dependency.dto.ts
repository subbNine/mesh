import { IsOptional, IsUUID } from 'class-validator';

export class CreateDependencyDto {
  @IsOptional()
  @IsUUID()
  blocksTaskId?: string;

  @IsOptional()
  @IsUUID()
  dependsOnTaskId?: string;
}
