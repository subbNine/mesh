import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, type Relation } from 'typeorm';
import type { ITaskDependency } from '@mesh/shared';
import { Project } from '../../projects/entities/projects.entity';
import { User } from '../../users/entities/users.entity';
import { TaskAssignee } from './task-assignees.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Relation<Project>;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ['todo', 'inprogress', 'review', 'done'], default: 'todo' })
  status: string;

  @Column({ nullable: true })
  assigneeId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: Relation<User> | null;

  @OneToMany(() => TaskAssignee, (taskAssignee) => taskAssignee.task)
  taskAssignees?: Relation<TaskAssignee[]>;

  assignees?: User[];

  @Column({ nullable: true })
  snapshotUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column()
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: Relation<User>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  blockedBy?: ITaskDependency[];
  blocks?: ITaskDependency[];
  isBlocked?: boolean;
  dependencyCount?: number;
}
