import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { User } from '../../users/entities/users.entity';
import { Task } from './tasks.entity';

@Entity('task_assignees')
export class TaskAssignee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @ManyToOne(() => Task, (task) => task.taskAssignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Relation<Task>;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column()
  assignedBy: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignedBy' })
  assigner: Relation<User>;

  @CreateDateColumn()
  assignedAt: Date;
}
