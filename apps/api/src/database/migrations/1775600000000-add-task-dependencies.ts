import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskDependencies1775600000000 implements MigrationInterface {
  name = 'AddTaskDependencies1775600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "task_dependencies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "blockingTaskId" uuid NOT NULL,
        "blockedTaskId" uuid NOT NULL,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_task_dependencies_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_task_dependencies_blocking_blocked" UNIQUE ("blockingTaskId", "blockedTaskId")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_task_dependencies_blockingTaskId" ON "task_dependencies" ("blockingTaskId")`);
    await queryRunner.query(`CREATE INDEX "IDX_task_dependencies_blockedTaskId" ON "task_dependencies" ("blockedTaskId")`);

    await queryRunner.query(`ALTER TABLE "task_dependencies" ADD CONSTRAINT "FK_task_dependencies_blockingTask" FOREIGN KEY ("blockingTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "task_dependencies" ADD CONSTRAINT "FK_task_dependencies_blockedTask" FOREIGN KEY ("blockedTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "task_dependencies" ADD CONSTRAINT "FK_task_dependencies_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_tmp" AS ENUM('assigned', 'mentioned', 'commented', 'added_to_project', 'due_soon', 'due_today', 'task_unblocked')`);
    await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_tmp" USING "type"::text::"public"."notifications_type_enum_tmp"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_tmp" RENAME TO "notifications_type_enum"`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD "data" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "data"`);
    await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('assigned', 'mentioned', 'commented', 'added_to_project', 'due_soon', 'due_today')`);
    await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::text::"public"."notifications_type_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);

    await queryRunner.query(`ALTER TABLE "task_dependencies" DROP CONSTRAINT "FK_task_dependencies_createdBy"`);
    await queryRunner.query(`ALTER TABLE "task_dependencies" DROP CONSTRAINT "FK_task_dependencies_blockedTask"`);
    await queryRunner.query(`ALTER TABLE "task_dependencies" DROP CONSTRAINT "FK_task_dependencies_blockingTask"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_task_dependencies_blockedTaskId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_task_dependencies_blockingTaskId"`);
    await queryRunner.query(`DROP TABLE "task_dependencies"`);
  }
}
