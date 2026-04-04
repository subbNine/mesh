import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Y from 'yjs';
import { CanvasDocument } from './entities/canvas_documents.entity';
import { TasksService } from '../tasks/tasks.service';
import { FilesService } from '../files/files.service';

@Injectable()
export class CanvasService {
  constructor(
    @InjectRepository(CanvasDocument)
    private readonly canvasRepo: Repository<CanvasDocument>,
    @Inject(forwardRef(() => TasksService))
    private readonly tasksService: any,
    private readonly filesService: FilesService,
  ) { }

  async getDoc(taskId: string): Promise<Buffer | null> {
    const doc = await this.canvasRepo.findOne({ where: { taskId } });
    return doc ? doc.doc : null;
  }

  async saveDoc(taskId: string, update: Buffer): Promise<void> {
    let docEntity = await this.canvasRepo.findOne({ where: { taskId } });

    if (docEntity) {
      const ydoc = new Y.Doc();
      try {
        if (docEntity.doc && docEntity.doc.length > 0) {
          Y.applyUpdate(ydoc, new Uint8Array(docEntity.doc));
        }
      } catch (err: any) {
        console.error(`[saveDoc] Failed to apply existing doc for ${taskId}. Length:`, docEntity.doc?.length, err.message);
        // Continue, ydoc is empty but we can apply the update
      }

      try {
        if (update && update.length > 0) {
          Y.applyUpdate(ydoc, new Uint8Array(update));
        }
      } catch (err: any) {
        console.error(`[saveDoc] Failed to apply update for ${taskId}. Length:`, update?.length, err.message);
        throw err;
      }

      const updatedState = Buffer.from(Y.encodeStateAsUpdate(ydoc));

      docEntity.doc = updatedState;
      await this.canvasRepo.save(docEntity);
    } else {
      docEntity = this.canvasRepo.create({
        taskId,
        doc: update,
      });
      await this.canvasRepo.save(docEntity);
    }
  }

  async createEmpty(taskId: string): Promise<CanvasDocument> {
    const ydoc = new Y.Doc();
    const emptyState = Buffer.from(Y.encodeStateAsUpdate(ydoc));

    const doc = this.canvasRepo.create({
      taskId,
      doc: emptyState,
    });
    return this.canvasRepo.save(doc);
  }

  async generateAndSaveSnapshot(taskId: string, buffer: Buffer): Promise<string> {
    const key = `snapshots/${taskId}/${Date.now()}.png`;

    const publicUrl = await this.filesService.uploadFile(key, buffer, 'image/png');

    await this.tasksService.updateSnapshot(taskId, publicUrl);

    return publicUrl;
  }
}

