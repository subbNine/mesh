import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/users.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recipientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({ type: 'enum', enum: ['assigned', 'mentioned', 'commented', 'added_to_project'] })
  type: string;

  @Column({ type: 'uuid', nullable: true })
  resourceId: string;

  @Column({ type: 'enum', enum: ['task', 'project'], nullable: true })
  resourceType: string;

  @Column({ nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
