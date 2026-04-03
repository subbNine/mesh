import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as Y from 'yjs';
import { CanvasDocument } from './entities/canvas_documents.entity';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class CanvasService {
  private s3Client: S3Client;
  private bucketName: string;
  private r2Endpoint: string;

  constructor(
    @InjectRepository(CanvasDocument)
    private canvasRepo: Repository<CanvasDocument>,
    @Inject(forwardRef(() => TasksService))
    private tasksService: any,
  ) {
    this.r2Endpoint = process.env.R2_ENDPOINT || '';
    this.bucketName = process.env.R2_BUCKET || '';
    
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: this.r2Endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async getDoc(taskId: string): Promise<Buffer | null> {
    const doc = await this.canvasRepo.findOne({ where: { taskId } });
    return doc ? doc.doc : null;
  }

  async saveDoc(taskId: string, update: Buffer): Promise<void> {
    let docEntity = await this.canvasRepo.findOne({ where: { taskId } });

    if (docEntity) {
      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, new Uint8Array(docEntity.doc));
      Y.applyUpdate(ydoc, new Uint8Array(update));
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

  async generateAndSaveSnapshot(taskId: string, dataUrl: string): Promise<string> {
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const key = `snapshots/${taskId}/${Date.now()}.png`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
    });

    await this.s3Client.send(command);

    const publicUrl = `${this.r2Endpoint}/${this.bucketName}/${key}`;

    await this.tasksService.updateSnapshot(taskId, publicUrl);

    return publicUrl;
  }
}

