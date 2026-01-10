import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max, IsDateString, IsUUID } from 'class-validator';
import { TaskStatus, TaskCategory } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskCategory)
  @IsOptional()
  category?: TaskCategory;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  priority?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}
