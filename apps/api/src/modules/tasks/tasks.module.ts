import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task, AuditLog, Organization } from '../../entities';
import { OrganizationScopeService } from './organization-scope.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task, AuditLog, Organization])],
  controllers: [TasksController],
  providers: [TasksService, OrganizationScopeService],
  exports: [TasksService],
})
export class TasksModule {}
