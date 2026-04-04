import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();
    
    response.status(status).json({
      statusCode: status,
      message: typeof exceptionResponse === 'object' ? exceptionResponse.message : exceptionResponse,
      error: typeof exceptionResponse === 'object' ? exceptionResponse.error : exception.name,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
