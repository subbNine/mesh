import { IsUUID } from 'class-validator';

export class UpdateTaskAssigneesDto {
  @IsUUID()
  userId: string;
}
