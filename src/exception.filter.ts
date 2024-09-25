import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let originalMessage: string | undefined;

    if (exception instanceof HttpException) {
      const responseMessage = exception.getResponse();
      originalMessage =
        typeof responseMessage === 'object' && responseMessage.hasOwnProperty('message')
          ? responseMessage['message']
          : responseMessage;
      message = originalMessage; 
    } else if (exception instanceof Error) {
      message = exception?.message || originalMessage; 
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    if (status === HttpStatus.BAD_REQUEST) {
      errorResponse.message = errorResponse.message ?? 'There was an issue with your request.';
    }

    response.status(status).json(errorResponse);
  }
}
