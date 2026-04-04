import { IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsString()
  elementId?: string;

  @IsOptional()
  @IsNumber()
  relX?: number;

  @IsOptional()
  @IsNumber()
  relY?: number;
}
