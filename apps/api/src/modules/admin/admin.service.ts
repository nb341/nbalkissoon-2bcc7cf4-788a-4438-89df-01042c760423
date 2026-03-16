import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Organization, RoleTemplate } from '../../entities';
import { ApproveUserDto, CreateRoleTemplateDto, UpdateRoleTemplateDto, UpdateUserRoleDto } from './dto';
import { UserStatus, Role, RolePermissions } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(RoleTemplate)
    private readonly roleTemplateRepository: Repository<RoleTemplate>,
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

    if (approveDto.roleTemplateId) {
      const template = await this.roleTemplateRepository.findOne({
        where: { id: approveDto.roleTemplateId },
      });
      if (!template) {
        throw new NotFoundException('Role template not found');
      }
      if (template.organizationId !== approveDto.organizationId) {
        throw new BadRequestException('Role template does not belong to organization');
      }
      if (template.baseRole !== approveDto.role) {
        throw new BadRequestException('Role template base role does not match selected role');
      }
      user.roleTemplateId = template.id;
    } else {
      user.roleTemplateId = null;
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
      roleTemplateId: user.roleTemplateId,
    }));
  }

  async getRoleTemplates(organizationId?: string): Promise<RoleTemplate[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.roleTemplateRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async createRoleTemplate(
    dto: CreateRoleTemplateDto,
    creator: User,
  ): Promise<RoleTemplate> {
    await this.ensureOrganizationExists(dto.organizationId);
    this.assertOwnerOnlyRole(dto.baseRole, creator);
    this.assertPermissionsAllowed(dto.baseRole, dto.permissions);

    const template = this.roleTemplateRepository.create({
      organizationId: dto.organizationId,
      name: dto.name.trim(),
      description: dto.description || null,
      baseRole: dto.baseRole,
      permissions: dto.permissions,
      createdById: creator.id,
    });

    return this.roleTemplateRepository.save(template);
  }

  async updateRoleTemplate(
    templateId: string,
    dto: UpdateRoleTemplateDto,
    updater: User,
  ): Promise<RoleTemplate> {
    const template = await this.roleTemplateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Role template not found');
    }

    const nextBaseRole = dto.baseRole || template.baseRole;
    this.assertOwnerOnlyRole(nextBaseRole, updater);
    if (dto.permissions) {
      this.assertPermissionsAllowed(nextBaseRole, dto.permissions);
    }

    Object.assign(template, {
      name: dto.name?.trim() ?? template.name,
      description: dto.description ?? template.description,
      baseRole: nextBaseRole,
      permissions: dto.permissions ?? template.permissions,
    });

    return this.roleTemplateRepository.save(template);
  }

  async deleteRoleTemplate(templateId: string, user: User): Promise<void> {
    const template = await this.roleTemplateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Role template not found');
    }

    this.assertOwnerOnlyRole(template.baseRole, user);

    await this.roleTemplateRepository.delete(templateId);
  }

  async updateUserRole(
    userId: string,
    dto: UpdateUserRoleDto,
    approver: User,
  ): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.assertOwnerOnlyRole(dto.role, approver);

    if (dto.roleTemplateId) {
      const template = await this.roleTemplateRepository.findOne({
        where: { id: dto.roleTemplateId },
      });
      if (!template) {
        throw new NotFoundException('Role template not found');
      }
      if (template.organizationId !== user.organizationId) {
        throw new BadRequestException('Role template does not belong to user organization');
      }
      if (template.baseRole !== dto.role) {
        throw new BadRequestException('Role template base role does not match selected role');
      }
      user.roleTemplateId = template.id;
    } else {
      user.roleTemplateId = null;
    }

    user.role = dto.role;
    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      roleTemplateId: user.roleTemplateId,
    };
  }

  private async ensureOrganizationExists(organizationId: string): Promise<void> {
    const org = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
  }

  private assertOwnerOnlyRole(role: Role, actor: User): void {
    if (role === Role.OWNER && actor.role !== Role.OWNER) {
      throw new BadRequestException('Only Owners can assign Owner-level roles');
    }
  }

  private assertPermissionsAllowed(role: Role, permissions: string[]): void {
    if (role === Role.OWNER) {
      return;
    }
    const allowed = new Set(RolePermissions[role] || []);
    const invalid = permissions.filter((permission) => !allowed.has(permission as any));
    if (invalid.length > 0) {
      throw new BadRequestException(
        'Permissions exceed allowed scope for base role: ' + invalid.join(', '),
      );
    }
  }
}
