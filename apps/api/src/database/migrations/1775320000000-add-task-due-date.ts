import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskDueDate1775320000000 implements MigrationInterface {
    name = 'AddTaskDueDate1775320000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ADD "dueDate" TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_tmp" AS ENUM('assigned', 'mentioned', 'commented', 'added_to_project', 'due_soon', 'due_today')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_tmp" USING "type"::text::"public"."notifications_type_enum_tmp"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_tmp" RENAME TO "notifications_type_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('assigned', 'mentioned', 'commented', 'added_to_project')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::text::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "dueDate"`);
    }
}
