import { MigrationInterface, QueryRunner } from "typeorm";

export class AddElementIdToCommentTable1775314814069 implements MigrationInterface {
    name = 'AddElementIdToCommentTable1775314814069'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" ADD "elementId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "elementId"`);
    }

}
