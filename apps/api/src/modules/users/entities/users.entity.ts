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

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ nullable: true, type: 'varchar' })
  emailVerificationCodeHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationExpiresAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationSentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
