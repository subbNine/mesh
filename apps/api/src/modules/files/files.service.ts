import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { IStorageProvider } from './storage/storage.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/files.entity';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    @Inject('STORAGE_PROVIDER') private readonly storageProvider: IStorageProvider,
    @InjectRepository(File) private readonly filesRepo: Repository<File>,
  ) {}

  async uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    return this.storageProvider.uploadFile(key, buffer, mimeType);
  }

  async upload(taskId: string, uploaderId: string, file: Express.Multer.File): Promise<File> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 10MB');
    }

    const ext = path.extname(file.originalname);
    const key = `files/${taskId}/${randomUUID()}${ext}`;

    const url = await this.storageProvider.uploadFile(key, file.buffer, file.mimetype);

    const fileRecord = this.filesRepo.create({
      taskId,
      uploaderId,
      url,
      key,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    return this.filesRepo.save(fileRecord);
  }

  async delete(fileId: string, userId: string): Promise<void> {
    const file = await this.filesRepo.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Attempt to delete from storage provider
    try {
      await this.storageProvider.deleteFile(file.key);
    } catch (error) {
      console.error('Failed to delete file from cloud storage', error);
      // Depending on requirements, we might want to continue and delete from DB anyway
    }

    await this.filesRepo.remove(file);
  }
}
