import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Workspace } from '../../workspaces/entities/workspaces.entity';
import { User } from '../../users/entities/users.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Index({ unique: true, where: '"publicSlug" IS NOT NULL' })
  @Column({ type: 'varchar', length: 24, nullable: true, unique: true })
  publicSlug: string | null;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
