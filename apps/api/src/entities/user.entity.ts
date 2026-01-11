import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Role, UserStatus } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({
    type: 'varchar',
    enum: Role,
    nullable: true,
  })
  role: Role | null;

  @Column({
    type: 'varchar',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ nullable: true })
  organizationId: string | null;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
