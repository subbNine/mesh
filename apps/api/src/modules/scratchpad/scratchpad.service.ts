import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IScratchpad } from '@mesh/shared';
import { Repository } from 'typeorm';

import { UpdateScratchpadDto } from './dto/update-scratchpad.dto';
import { Scratchpad } from './entities/scratchpad.entity';

const createEmptyScratchpadContent = (): Record<string, unknown> => ({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});

@Injectable()
export class ScratchpadService {
  constructor(
    @InjectRepository(Scratchpad)
    private readonly scratchpadRepo: Repository<Scratchpad>,
  ) {}

  async getForUser(userId: string): Promise<IScratchpad> {
    const scratchpad = await this.ensureScratchpad(userId);
    return this.toDto(scratchpad);
  }

  async updateForUser(userId: string, dto: UpdateScratchpadDto): Promise<IScratchpad> {
    const scratchpad = await this.ensureScratchpad(userId);

    if (dto.content !== undefined) {
      scratchpad.content = this.normalizeContent(dto.content);
    }

    const saved = await this.scratchpadRepo.save(scratchpad);
    return this.toDto(saved);
  }

  private async ensureScratchpad(userId: string): Promise<Scratchpad> {
    const existing = await this.scratchpadRepo.findOne({ where: { userId } });

    if (existing) {
      existing.content = this.normalizeContent(existing.content);
      return existing;
    }

    const scratchpad = this.scratchpadRepo.create({
      userId,
      content: createEmptyScratchpadContent(),
    });

    return this.scratchpadRepo.save(scratchpad);
  }

  private normalizeContent(content: Record<string, unknown> | null | undefined) {
    if (content && typeof content === 'object' && 'type' in content) {
      return content;
    }

    return createEmptyScratchpadContent();
  }

  private toDto(scratchpad: Scratchpad): IScratchpad {
    return {
      id: scratchpad.id,
      userId: scratchpad.userId,
      content: this.normalizeContent(scratchpad.content),
      createdAt: scratchpad.createdAt,
      updatedAt: scratchpad.updatedAt,
    };
  }
}
