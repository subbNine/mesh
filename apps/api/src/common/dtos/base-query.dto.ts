import { IsNumberString, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

const optionalBooleanMapper = new Map([
    ['true', true],
    ['false', false],
    ['1', true],
    ['0', false],
]);

export class BaseQueryDto {
    @IsNumberString()
    @IsOptional()
    perPage?: number;

    @IsNumberString()
    @IsOptional()
    page?: number;

    @IsOptional()
    @IsString()
    sort?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    relations?: string;

    @IsDateString()
    @IsOptional()
    startDateFilter?: Date;

    @IsDateString()
    @IsOptional()
    endDateFilter?: Date;

    @IsString()
    @IsOptional()
    authUserId?: string;

    @Transform(({ value }) => optionalBooleanMapper.get(value))
    @IsOptional()
    @IsBoolean()
    metadata?: boolean;
}