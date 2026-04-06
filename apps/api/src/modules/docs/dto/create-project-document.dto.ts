import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateProjectDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(140)
  title?: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;
}
