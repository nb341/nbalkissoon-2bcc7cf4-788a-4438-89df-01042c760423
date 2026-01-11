import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Organization } from '../../entities';
import { Role, UserStatus } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed(): Promise<void> {
    // Check if already seeded
    const existingOwner = await this.userRepository.findOne({
      where: { email: 'admin@system.com' },
    });

    if (existingOwner) {
      console.log('Seed data already exists, skipping...');
      return;
    }

    console.log('Seeding initial data...');

    // Create default organization
    const defaultOrg = this.organizationRepository.create({
      name: 'Default Organization',
    });
    await this.organizationRepository.save(defaultOrg);
    console.log('Created default organization:', defaultOrg.id);

    // Create a child organization (team)
    const teamOrg = this.organizationRepository.create({
      name: 'Team Alpha',
      parentId: defaultOrg.id,
    });
    await this.organizationRepository.save(teamOrg);
    console.log('Created team organization:', teamOrg.id);

    // Create initial Owner account
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const owner = this.userRepository.create({
      email: 'admin@system.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
      organizationId: defaultOrg.id,
    });
    await this.userRepository.save(owner);
    console.log('Created initial Owner account: admin@system.com / admin123');

    console.log('Seed completed!');
  }
}
