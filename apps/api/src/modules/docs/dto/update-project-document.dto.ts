import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProjectDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(140)
  title?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}
