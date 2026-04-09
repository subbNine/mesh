import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubtasks1775900000000 implements MigrationInterface {
  name = 'AddSubtasks1775900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subtasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "taskId" uuid NOT NULL,
        "title" character varying(200) NOT NULL,
        "isCompleted" boolean NOT NULL DEFAULT false,
        "position" integer NOT NULL DEFAULT 0,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "completedAt" TIMESTAMP,
        CONSTRAINT "PK_subtasks_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_subtasks_taskId" ON "subtasks" ("taskId")`);
    await queryRunner.query(`CREATE INDEX "IDX_subtasks_task_position" ON "subtasks" ("taskId", "position")`);
    await queryRunner.query(`ALTER TABLE "subtasks" ADD CONSTRAINT "FK_subtasks_taskId" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "subtasks" ADD CONSTRAINT "FK_subtasks_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subtasks" DROP CONSTRAINT "FK_subtasks_createdBy"`);
    await queryRunner.query(`ALTER TABLE "subtasks" DROP CONSTRAINT "FK_subtasks_taskId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subtasks_task_position"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subtasks_taskId"`);
    await queryRunner.query(`DROP TABLE "subtasks"`);
  }
}
