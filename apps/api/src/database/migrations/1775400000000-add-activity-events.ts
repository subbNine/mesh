import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityEvents1775400000000 implements MigrationInterface {
  name = 'AddActivityEvents1775400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "activity_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId" uuid NOT NULL,
        "projectId" uuid,
        "taskId" uuid,
        "actorId" uuid NOT NULL,
        "eventType" character varying NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_activity_workspace_created" ON "activity_events" ("workspaceId", "createdAt" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_activity_task_created" ON "activity_events" ("taskId", "createdAt" DESC)`);

    await queryRunner.query(`ALTER TABLE "activity_events" ADD CONSTRAINT "FK_activity_events_workspace" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "activity_events" ADD CONSTRAINT "FK_activity_events_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "activity_events" ADD CONSTRAINT "FK_activity_events_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "activity_events" ADD CONSTRAINT "FK_activity_events_actor" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "activity_events" DROP CONSTRAINT "FK_activity_events_actor"`);
    await queryRunner.query(`ALTER TABLE "activity_events" DROP CONSTRAINT "FK_activity_events_task"`);
    await queryRunner.query(`ALTER TABLE "activity_events" DROP CONSTRAINT "FK_activity_events_project"`);
    await queryRunner.query(`ALTER TABLE "activity_events" DROP CONSTRAINT "FK_activity_events_workspace"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_activity_task_created"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_activity_workspace_created"`);
    await queryRunner.query(`DROP TABLE "activity_events"`);
  }
}
