import { IsObject, IsOptional } from 'class-validator';

export class UpdateScratchpadDto {
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}
