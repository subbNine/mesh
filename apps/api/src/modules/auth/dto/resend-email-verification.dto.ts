import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ResendEmailVerificationDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  inviteToken?: string;
}
