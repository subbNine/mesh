import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @BeforeInsert()
  normalizeEmail() {
    this.email = this.email.toLowerCase();
  }

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  userName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
