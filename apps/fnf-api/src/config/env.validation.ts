import {plainToInstance} from 'class-transformer';
import {IsBoolean, IsNumber, IsOptional, IsString, validateSync} from 'class-validator';

class EnvVariables {
  @IsNumber()
  @IsOptional()
  PORT?: number = 3333;

  @IsString()
  @IsOptional()
  GLOBAL_PREFIX?: string = 'api';

  // HTTP CORS
  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string = '*'; // '*', 'true', or CSV of origins

  @IsBoolean()
  @IsOptional()
  CORS_CREDENTIALS?: boolean = false;

  // WebSocket CORS / config
  @IsString()
  @IsOptional()
  WS_CORS_ORIGIN?: string = 'true'; // 'true' means allow any, or CSV of origins, or '*'

  @IsString()
  @IsOptional()
  WS_METHODS?: string = 'GET,POST';

  @IsBoolean()
  @IsOptional()
  WS_CREDENTIALS?: boolean = false;

  @IsNumber()
  @IsOptional()
  WS_PORT?: number = 3334;

  // Keep placeholders for existing envs to avoid validation errors if present
  @IsOptional()
  @IsString()
  FNF_INCOMPATIBLE_PATHS?: string;

  @IsOptional()
  @IsString()
  FNF_CONTAINER_PATHS?: string;

  @IsOptional()
  @IsString()
  FNF_START_PATH?: string;

  @IsOptional()
  @IsString()
  FNF_DOCKER_ROOT?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  // Convert types where necessary
  const coerced = {...config} as Record<string, unknown>;
  if (typeof coerced.PORT === 'string') coerced.PORT = Number(coerced.PORT);
  if (typeof coerced.WS_PORT === 'string') coerced.WS_PORT = Number(coerced.WS_PORT);
  if (typeof coerced.CORS_CREDENTIALS === 'string') coerced.CORS_CREDENTIALS = coerced.CORS_CREDENTIALS === 'true';
  if (typeof coerced.WS_CREDENTIALS === 'string') coerced.WS_CREDENTIALS = coerced.WS_CREDENTIALS === 'true';

  const validatedConfig = plainToInstance(EnvVariables, coerced, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {skipMissingProperties: true});
  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ')}`);
  }

  return validatedConfig as unknown as Record<string, any>;
}
