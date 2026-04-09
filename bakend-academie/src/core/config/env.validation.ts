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
  JWT_OAUTH_STATE_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  API_PUBLIC_ORIGIN?: string;

  @IsOptional()
  @IsString()
  FRONTEND_APP_ORIGIN?: string;

  @IsOptional()
  @IsString()
  OAUTH_GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  OAUTH_GOOGLE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  OAUTH_GITHUB_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  OAUTH_GITHUB_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  PAYMENT_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;
}
