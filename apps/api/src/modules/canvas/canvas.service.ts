import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Y from 'yjs';
import { CanvasDocument } from './entities/canvas_documents.entity';
import { TasksService } from '../tasks/tasks.service';
import { FilesService } from '../files/files.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CanvasService {
  private readonly lastNotified = new Map<string, number>();

  constructor(
    @InjectRepository(CanvasDocument)
    private readonly canvasRepo: Repository<CanvasDocument>,
    @Inject(forwardRef(() => TasksService))
    private readonly tasksService: any,
    private readonly filesService: FilesService,
    private readonly notificationsService: NotificationsService,
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

  async handleMentions(taskId: string, actorId: string, elementId: string, text: string): Promise<void> {
    // 1. Extract IDs from data-mention-id attributes (TipTap format)
    const mentionIdRegex = /data-mention-id="([^"]+)"/g;
    const taggedIds = new Set<string>();
    let match;
    while ((match = mentionIdRegex.exec(text)) !== null) {
      taggedIds.add(match[1]);
    }

    // 2. Fallback to name-based regex if no IDs found (for legacy/compatibility)
    if (taggedIds.size === 0) {
      const nameRegex = /@(\w+)/g;
      const names = new Set<string>();
      while ((match = nameRegex.exec(text)) !== null) {
        names.add(match[1]);
      }

      if (names.size > 0) {
        const users = await this.tasksService.usersService.findUsersByNames(Array.from(names));
        users.forEach((u: any) => taggedIds.add(u.id));
      }
    }

    if (taggedIds.size === 0) return;

    // 3. Notify and suppress duplicates
    const now = Date.now();
    const SUPPRESSION_MS = 5 * 60 * 1000; // 5 minutes

    for (const userId of taggedIds) {
      // Don't notify self
      if (userId === actorId) continue;

      const suppressionKey = `${taskId}:${elementId}:${userId}`;
      const last = this.lastNotified.get(suppressionKey);

      if (!last || (now - last) > SUPPRESSION_MS) {
        await this.notificationsService.createMentionNotification(taskId, userId, actorId).catch(console.error);
        this.lastNotified.set(suppressionKey, now);
      }
    }

    // Periodically clean up the suppression map to avoid leaks
    if (this.lastNotified.size > 1000) {
      for (const [key, timestamp] of this.lastNotified.entries()) {
        if (now - timestamp > SUPPRESSION_MS) {
          this.lastNotified.delete(key);
        }
      }
    }
  }
}

