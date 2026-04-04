import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsString()
  API_PREFIX?: string;

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  PAYMENT_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;
}

