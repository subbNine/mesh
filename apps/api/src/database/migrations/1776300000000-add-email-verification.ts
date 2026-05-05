import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1776300000000 implements MigrationInterface {
  name = 'AddEmailVerification1776300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "isEmailVerified" boolean NOT NULL DEFAULT true,
      ADD COLUMN "emailVerifiedAt" TIMESTAMP DEFAULT now(),
      ADD COLUMN "emailVerificationCodeHash" character varying,
      ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP,
      ADD COLUMN "emailVerificationSentAt" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "emailVerificationSentAt",
      DROP COLUMN "emailVerificationExpiresAt",
      DROP COLUMN "emailVerificationCodeHash",
      DROP COLUMN "emailVerifiedAt",
      DROP COLUMN "isEmailVerified"
    `);
  }
}
