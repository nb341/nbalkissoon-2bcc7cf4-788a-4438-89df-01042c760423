import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User, Organization, Task } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, Task])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
