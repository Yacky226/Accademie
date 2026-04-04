import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';

@Catch(Error)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(_exception: Error, _host: ArgumentsHost): void {}
}

