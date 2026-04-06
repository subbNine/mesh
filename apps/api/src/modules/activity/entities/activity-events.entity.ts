import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/users.entity';

@Entity('activity_events')
@Index('IDX_activity_workspace_created', ['workspaceId', 'createdAt'])
@Index('IDX_activity_task_created', ['taskId', 'createdAt'])
export class ActivityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column({ nullable: true, type: 'varchar' })
  projectId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  taskId: string | null;

  @Column()
  actorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column({ type: 'varchar' })
  eventType: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  payload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
