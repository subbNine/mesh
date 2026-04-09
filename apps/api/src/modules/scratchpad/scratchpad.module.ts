import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ScratchpadController } from './scratchpad.controller';
import { ScratchpadService } from './scratchpad.service';
import { Scratchpad } from './entities/scratchpad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Scratchpad])],
  controllers: [ScratchpadController],
  providers: [ScratchpadService],
  exports: [ScratchpadService],
})
export class ScratchpadModule {}
