import { IsString, IsNotEmpty } from 'class-validator';

export class ExcludeWorkspaceMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
