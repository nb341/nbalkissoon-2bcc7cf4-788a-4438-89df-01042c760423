import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from '../config';
import { AuthModule, JwtAuthGuard } from '../modules/auth';
import { TasksModule } from '../modules/tasks';
import { AuditLogModule } from '../modules/audit-log';
import { AdminModule } from '../modules/admin';
import { SeedModule } from '../modules/seed';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    TasksModule,
    AuditLogModule,
    AdminModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
