import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGlobalSearch1776100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add search_vector to tasks
        await queryRunner.query(`
            ALTER TABLE tasks ADD COLUMN search_vector tsvector
            GENERATED ALWAYS AS (
                to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
            ) STORED;
        `);
        await queryRunner.query(`
            CREATE INDEX tasks_search_idx ON tasks USING GIN(search_vector);
        `);

        // Add search_vector to subtasks
        await queryRunner.query(`
            ALTER TABLE subtasks ADD COLUMN search_vector tsvector
            GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, ''))) STORED;
        `);
        await queryRunner.query(`
            CREATE INDEX subtasks_search_idx ON subtasks USING GIN(search_vector);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX subtasks_search_idx;`);
        await queryRunner.query(`ALTER TABLE subtasks DROP COLUMN search_vector;`);
        await queryRunner.query(`DROP INDEX tasks_search_idx;`);
        await queryRunner.query(`ALTER TABLE tasks DROP COLUMN search_vector;`);
    }
}
