import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Task } from '../../tasks/entities/tasks.entity';

@Entity('canvas_documents')
export class CanvasDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  taskId: string;

  @OneToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ type: 'bytea' })
  doc: Buffer;

  @UpdateDateColumn()
  updatedAt: Date;
}
