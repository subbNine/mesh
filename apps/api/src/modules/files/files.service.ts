import { Injectable, Inject } from '@nestjs/common';
import { IStorageProvider } from './storage/storage.interface';

@Injectable()
export class FilesService {
  constructor(
    @Inject('STORAGE_PROVIDER') private readonly storageProvider: IStorageProvider,
  ) {}

  async uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    return this.storageProvider.uploadFile(key, buffer, mimeType);
  }
}
