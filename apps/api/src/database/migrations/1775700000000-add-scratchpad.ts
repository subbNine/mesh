import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScratchpad1775700000000 implements MigrationInterface {
  name = 'AddScratchpad1775700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "scratchpads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "content" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_scratchpads_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_scratchpads_userId" UNIQUE ("userId")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_scratchpads_userId" ON "scratchpads" ("userId")`);
    await queryRunner.query(`ALTER TABLE "scratchpads" ADD CONSTRAINT "FK_scratchpads_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scratchpads" DROP CONSTRAINT "FK_scratchpads_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_scratchpads_userId"`);
    await queryRunner.query(`DROP TABLE "scratchpads"`);
  }
}
