import { IsString, IsNotEmpty } from 'class-validator';

export class ProcessMentionsDto {
  @IsString()
  @IsNotEmpty()
  elementId: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
