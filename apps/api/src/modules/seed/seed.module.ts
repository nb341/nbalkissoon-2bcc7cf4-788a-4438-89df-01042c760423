import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User, Organization } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
