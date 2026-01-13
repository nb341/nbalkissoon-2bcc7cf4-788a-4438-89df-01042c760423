import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Organization } from '../../entities';
import { ApproveUserDto } from './dto';
import { UserStatus, Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async getPendingRegistrations(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find({
      where: { status: UserStatus.PENDING },
      order: { createdAt: 'DESC' },
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    }));
  }

  async approveUser(userId: string, approveDto: ApproveUserDto, approver: User): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException('User is not pending approval');
    }

    // Verify organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: approveDto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Only Owner can assign Owner role
    if (approveDto.role === Role.OWNER && approver.role !== Role.OWNER) {
      throw new BadRequestException('Only Owners can assign the Owner role');
    }

    // Update user
    user.status = UserStatus.ACTIVE;
    user.role = approveDto.role;
    user.organizationId = approveDto.organizationId;

    await this.userRepository.save(user);

    return { message: 'User approved successfully' };
  }

  async rejectUser(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException('User is not pending approval');
    }

    user.status = UserStatus.REJECTED;

    await this.userRepository.save(user);

    return { message: 'User rejected' };
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.organizationRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getUsers(organizationId?: string): Promise<Partial<User>[]> {
    const where: any = { status: UserStatus.ACTIVE };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const users = await this.userRepository.find({
      where,
      order: { firstName: 'ASC', lastName: 'ASC' },
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
    }));
  }
}
