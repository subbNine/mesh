import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectLibrary1775500000000 implements MigrationInterface {
  name = 'AddProjectLibrary1775500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "project_folders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "projectId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_folders_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "project_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "projectId" uuid NOT NULL,
        "folderId" uuid,
        "title" character varying NOT NULL DEFAULT 'Untitled document',
        "content" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "authorId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_documents_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "project_files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "projectId" uuid NOT NULL,
        "folderId" uuid,
        "name" character varying NOT NULL,
        "url" character varying NOT NULL,
        "key" character varying NOT NULL,
        "mimeType" character varying NOT NULL,
        "sizeBytes" integer NOT NULL,
        "uploaderId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_files_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_project_folders_project_created" ON "project_folders" ("projectId", "createdAt" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_project_documents_project_updated" ON "project_documents" ("projectId", "updatedAt" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_project_documents_folder" ON "project_documents" ("folderId")`);
    await queryRunner.query(`CREATE INDEX "IDX_project_files_project_created" ON "project_files" ("projectId", "createdAt" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_project_files_folder" ON "project_files" ("folderId")`);

    await queryRunner.query(`ALTER TABLE "project_folders" ADD CONSTRAINT "FK_project_folders_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "project_folders" ADD CONSTRAINT "FK_project_folders_creator" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "project_documents" ADD CONSTRAINT "FK_project_documents_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "project_documents" ADD CONSTRAINT "FK_project_documents_folder" FOREIGN KEY ("folderId") REFERENCES "project_folders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "project_documents" ADD CONSTRAINT "FK_project_documents_author" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "project_files" ADD CONSTRAINT "FK_project_files_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "project_files" ADD CONSTRAINT "FK_project_files_folder" FOREIGN KEY ("folderId") REFERENCES "project_folders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "project_files" ADD CONSTRAINT "FK_project_files_uploader" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project_files" DROP CONSTRAINT "FK_project_files_uploader"`);
    await queryRunner.query(`ALTER TABLE "project_files" DROP CONSTRAINT "FK_project_files_folder"`);
    await queryRunner.query(`ALTER TABLE "project_files" DROP CONSTRAINT "FK_project_files_project"`);
    await queryRunner.query(`ALTER TABLE "project_documents" DROP CONSTRAINT "FK_project_documents_author"`);
    await queryRunner.query(`ALTER TABLE "project_documents" DROP CONSTRAINT "FK_project_documents_folder"`);
    await queryRunner.query(`ALTER TABLE "project_documents" DROP CONSTRAINT "FK_project_documents_project"`);
    await queryRunner.query(`ALTER TABLE "project_folders" DROP CONSTRAINT "FK_project_folders_creator"`);
    await queryRunner.query(`ALTER TABLE "project_folders" DROP CONSTRAINT "FK_project_folders_project"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_project_files_folder"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_project_files_project_created"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_project_documents_folder"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_project_documents_project_updated"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_project_folders_project_created"`);
    await queryRunner.query(`DROP TABLE "project_files"`);
    await queryRunner.query(`DROP TABLE "project_documents"`);
    await queryRunner.query(`DROP TABLE "project_folders"`);
  }
}
