import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';

@Catch(Error)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    void exception;
    void host;
  }
}
