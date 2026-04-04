import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelativeCoordsToCommentTable1775315057118 implements MigrationInterface {
    name = 'AddRelativeCoordsToCommentTable1775315057118'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" ADD "relX" double precision`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "relY" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "relY"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "relX"`);
    }

}
