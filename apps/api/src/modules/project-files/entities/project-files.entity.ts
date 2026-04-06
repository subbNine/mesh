import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/projects.entity';
import { User } from '../../users/entities/users.entity';
import { ProjectFolder } from '../../docs/entities/project-folders.entity';

@Entity('project_files')
export class ProjectFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @Column({ nullable: true })
  folderId!: string | null;

  @ManyToOne(() => ProjectFolder, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'folderId' })
  folder!: ProjectFolder | null;

  @Column()
  name!: string;

  @Column()
  url!: string;

  @Column()
  key!: string;

  @Column()
  mimeType!: string;

  @Column({ type: 'int' })
  sizeBytes!: number;

  @Column()
  uploaderId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaderId' })
  uploader!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
