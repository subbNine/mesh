import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvitations1776000000000 implements MigrationInterface {
  name = 'AddInvitations1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "scope" character varying NOT NULL,
        "email" character varying NOT NULL,
        "workspaceId" uuid NOT NULL,
        "projectId" uuid,
        "role" character varying NOT NULL,
        "inviterId" uuid NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "acceptedAt" TIMESTAMP,
        "acceptedByUserId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invitations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_invitations_email" ON "invitations" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_invitations_expiresAt" ON "invitations" ("expiresAt")`);

    await queryRunner.query(`
      ALTER TABLE "invitations"
      ADD CONSTRAINT "FK_invitations_workspaceId"
      FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "invitations"
      ADD CONSTRAINT "FK_invitations_projectId"
      FOREIGN KEY ("projectId") REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "invitations"
      ADD CONSTRAINT "FK_invitations_inviterId"
      FOREIGN KEY ("inviterId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "invitations"
      ADD CONSTRAINT "FK_invitations_acceptedByUserId"
      FOREIGN KEY ("acceptedByUserId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_acceptedByUserId"`);
    await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_inviterId"`);
    await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_projectId"`);
    await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_workspaceId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invitations_expiresAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invitations_email"`);
    await queryRunner.query(`DROP TABLE "invitations"`);
  }
}
