import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Organization, Task, AuditLog } from '../entities';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'devpassword',
  database: process.env.DATABASE_NAME || 'taskmanager_dev',
  entities: [User, Organization, Task, AuditLog],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
});
