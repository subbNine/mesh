import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskAssignees1775800000000 implements MigrationInterface {
  name = 'AddTaskAssignees1775800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "task_assignees" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "taskId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "assignedBy" uuid NOT NULL,
        "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_task_assignees_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_task_assignees_task_user" UNIQUE ("taskId", "userId")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_task_assignees_taskId" ON "task_assignees" ("taskId")`);
    await queryRunner.query(`CREATE INDEX "IDX_task_assignees_userId" ON "task_assignees" ("userId")`);
    await queryRunner.query(`ALTER TABLE "task_assignees" ADD CONSTRAINT "FK_task_assignees_taskId" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "task_assignees" ADD CONSTRAINT "FK_task_assignees_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "task_assignees" ADD CONSTRAINT "FK_task_assignees_assignedBy" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    await queryRunner.query(`
      INSERT INTO "task_assignees" ("taskId", "userId", "assignedBy")
      SELECT "id", "assigneeId", COALESCE("createdBy", "assigneeId")
      FROM "tasks"
      WHERE "assigneeId" IS NOT NULL
      ON CONFLICT ("taskId", "userId") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task_assignees" DROP CONSTRAINT "FK_task_assignees_assignedBy"`);
    await queryRunner.query(`ALTER TABLE "task_assignees" DROP CONSTRAINT "FK_task_assignees_userId"`);
    await queryRunner.query(`ALTER TABLE "task_assignees" DROP CONSTRAINT "FK_task_assignees_taskId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_task_assignees_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_task_assignees_taskId"`);
    await queryRunner.query(`DROP TABLE "task_assignees"`);
  }
}
