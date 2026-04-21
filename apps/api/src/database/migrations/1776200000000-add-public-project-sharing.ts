import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublicProjectSharing1776200000000 implements MigrationInterface {
  name = 'AddPublicProjectSharing1776200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "projects"
      ADD COLUMN "publicSlug" character varying(24),
      ADD COLUMN "isPublic" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_projects_publicSlug"
      ON "projects" ("publicSlug")
      WHERE "publicSlug" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_projects_publicSlug"`);
    await queryRunner.query(`
      ALTER TABLE "projects"
      DROP COLUMN "isPublic",
      DROP COLUMN "publicSlug"
    `);
  }
}
