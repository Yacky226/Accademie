import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';

@Catch(Error)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(_exception: Error, _host: ArgumentsHost): void {}
}

