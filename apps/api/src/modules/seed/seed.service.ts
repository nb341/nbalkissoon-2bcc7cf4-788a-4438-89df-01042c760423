import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Organization, Task } from '../../entities';
import { Role, UserStatus, TaskStatus, TaskCategory } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed(): Promise<void> {
    const existingOwner = await this.userRepository.findOne({
      where: { email: 'admin@system.com' },
    });

    if (existingOwner) {
      console.log('Seed data already exists, skipping...');
      return;
    }

    console.log('Seeding initial data...');

    // Create parent organization
    const parentOrg = this.organizationRepository.create({
      name: 'Acme Corporation',
      description: 'Parent organization',
    });
    await this.organizationRepository.save(parentOrg);
    console.log('Created parent organization:', parentOrg.name);

    // Create child organizations (teams)
    const engineeringTeam = this.organizationRepository.create({
      name: 'Engineering Team',
      description: 'Software development team',
      parentId: parentOrg.id,
    });
    await this.organizationRepository.save(engineeringTeam);

    const marketingTeam = this.organizationRepository.create({
      name: 'Marketing Team',
      description: 'Marketing and sales team',
      parentId: parentOrg.id,
    });
    await this.organizationRepository.save(marketingTeam);
    console.log('Created child organizations');

    // Create users with different roles
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Owner (System Admin)
    const owner = this.userRepository.create({
      email: 'admin@system.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
      organizationId: parentOrg.id,
    });
    await this.userRepository.save(owner);
    console.log('Created Owner: admin@system.com / password123');

    // Admin user
    const admin = this.userRepository.create({
      email: 'admin@acme.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Manager',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      organizationId: parentOrg.id,
    });
    await this.userRepository.save(admin);
    console.log('Created Admin: admin@acme.com / password123');

    // Viewer users
    const viewer1 = this.userRepository.create({
      email: 'alice@acme.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Developer',
      role: Role.VIEWER,
      status: UserStatus.ACTIVE,
      organizationId: parentOrg.id,
    });
    await this.userRepository.save(viewer1);
    console.log('Created Viewer: alice@acme.com / password123');

    const viewer2 = this.userRepository.create({
      email: 'bob@acme.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Designer',
      role: Role.VIEWER,
      status: UserStatus.ACTIVE,
      organizationId: parentOrg.id,
    });
    await this.userRepository.save(viewer2);
    console.log('Created Viewer: bob@acme.com / password123');

    // Pending user (for testing approval flow)
    const pendingUser = this.userRepository.create({
      email: 'pending@acme.com',
      password: hashedPassword,
      firstName: null,
      lastName: null,
      role: null,
      status: UserStatus.PENDING,
      organizationId: null,
    });
    await this.userRepository.save(pendingUser);
    console.log('Created Pending User: pending@acme.com / password123');

    // Create sample tasks
    const tasks = [
      {
        title: 'Setup project infrastructure',
        description: 'Configure CI/CD pipeline and deployment scripts',
        status: TaskStatus.COMPLETED,
        category: TaskCategory.WORK,
        priority: 9,
        createdById: owner.id,
        assignedToId: admin.id,
        organizationId: parentOrg.id,
      },
      {
        title: 'Design database schema',
        description: 'Create ERD and define all entity relationships',
        status: TaskStatus.COMPLETED,
        category: TaskCategory.WORK,
        priority: 8,
        createdById: admin.id,
        assignedToId: viewer1.id,
        organizationId: parentOrg.id,
      },
      {
        title: 'Implement authentication',
        description: 'JWT-based auth with refresh tokens',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 10,
        createdById: admin.id,
        assignedToId: viewer1.id,
        organizationId: parentOrg.id,
      },
      {
        title: 'Create UI mockups',
        description: 'Design dashboard and task management screens',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 7,
        createdById: admin.id,
        assignedToId: viewer2.id,
        organizationId: parentOrg.id,
      },
      {
        title: 'Write API documentation',
        description: 'Document all endpoints with examples',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 6,
        createdById: owner.id,
        assignedToId: null,
        organizationId: parentOrg.id,
      },
      {
        title: 'Code review session',
        description: 'Review pull requests from the team',
        status: TaskStatus.TODO,
        category: TaskCategory.URGENT,
        priority: 8,
        createdById: admin.id,
        assignedToId: admin.id,
        organizationId: parentOrg.id,
      },
      {
        title: 'Team lunch planning',
        description: 'Organize team building lunch for Friday',
        status: TaskStatus.TODO,
        category: TaskCategory.PERSONAL,
        priority: 3,
        createdById: viewer1.id,
        assignedToId: viewer1.id,
        organizationId: parentOrg.id,
      },
      {
        title: 'Update portfolio website',
        description: 'Add recent projects to personal portfolio',
        status: TaskStatus.TODO,
        category: TaskCategory.PERSONAL,
        priority: 2,
        createdById: viewer2.id,
        assignedToId: viewer2.id,
        organizationId: parentOrg.id,
      },
    ];

    for (const taskData of tasks) {
      const task = this.taskRepository.create(taskData);
      await this.taskRepository.save(task);
    }
    console.log('Created', tasks.length, 'sample tasks');

    console.log('\n========================================');
    console.log('SEED COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\nTest Accounts:');
    console.log('----------------------------------------');
    console.log('OWNER:   admin@system.com / password123');
    console.log('ADMIN:   admin@acme.com   / password123');
    console.log('VIEWER:  alice@acme.com   / password123');
    console.log('VIEWER:  bob@acme.com     / password123');
    console.log('PENDING: pending@acme.com / password123');
    console.log('----------------------------------------\n');
  }
}
