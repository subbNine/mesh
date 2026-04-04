import { IsString, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsNumber()
  canvasX: number;

  @IsNumber()
  canvasY: number;
}
