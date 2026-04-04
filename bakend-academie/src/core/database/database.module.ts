import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			useFactory: (): TypeOrmModuleOptions => ({
				type: 'postgres',
				host: process.env.DB_HOST ?? 'localhost',
				port: Number(process.env.DB_PORT ?? 5432),
				username: process.env.DB_USERNAME ?? 'postgres',
				password: process.env.DB_PASSWORD ?? 'postgres',
				database: process.env.DB_NAME ?? 'academie',
				synchronize: process.env.DB_SYNCHRONIZE === 'true',
				autoLoadEntities: true,
				ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
			}),
		}),
	],
})
export class DatabaseModule {}

