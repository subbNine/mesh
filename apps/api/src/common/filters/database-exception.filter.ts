import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, ConflictException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

@Catch(QueryFailedError, EntityNotFoundError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'DatabaseError';

    if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
      error = 'Not Found';
    } else if (exception instanceof QueryFailedError) {
      // Postgres/SQLite/MySQL unique constraint violation code check
      const driverError = (exception as any).driverError || {};
      if (driverError.code === '23505' || driverError.errno === 19 || driverError.code === 'ER_DUP_ENTRY') {
        status = HttpStatus.CONFLICT;
        message = 'Resource already exists';
        error = 'Conflict';
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
