import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Project } from '../../projects/entities/projects.entity';
import { User } from '../../users/entities/users.entity';
import { Workspace } from '../../workspaces/entities/workspaces.entity';

@Entity('invitations')
@Index('IDX_invitations_email', ['email'])
@Index('IDX_invitations_expiresAt', ['expiresAt'])
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  scope: 'workspace' | 'project';

  @Column()
  email: string;

  @BeforeInsert()
  normalizeEmail() {
    this.email = this.email.trim().toLowerCase();
  }

  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Column({ nullable: true })
  projectId: string | null;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project | null;

  @Column()
  role: string;

  @Column()
  inviterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviterId' })
  inviter: User;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date | null;

  @Column({ nullable: true })
  acceptedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'acceptedByUserId' })
  acceptedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
