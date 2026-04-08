import { CreateDateColumn, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Task } from '../../tasks/entities/tasks.entity';
import { User } from '../../users/entities/users.entity';

@Entity('task_dependencies')
@Unique('UQ_task_dependencies_blocking_blocked', ['blockingTaskId', 'blockedTaskId'])
export class TaskDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  blockingTaskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockingTaskId' })
  blockingTask: Task;

  @Column('uuid')
  blockedTaskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockedTaskId' })
  blockedTask: Task;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;
}
