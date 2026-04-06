import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class MoveProjectLibraryItemDto {
  @IsUUID()
  itemId: string;

  @IsIn(['document', 'file'])
  itemType: 'document' | 'file';

  @IsOptional()
  @IsUUID()
  folderId?: string;
}
