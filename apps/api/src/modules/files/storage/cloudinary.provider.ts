import { IStorageProvider } from './storage.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryStorageProvider implements IStorageProvider {
  constructor(private readonly configService: ConfigService) { }

  async uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    // This is a stub for Cloudinary
    // e.g. using cloudinary.uploader.upload_stream
    throw new Error('Cloudinary Storage provider is not fully implemented yet');
  }

  async deleteFile(key: string): Promise<void> {
    throw new Error('Cloudinary Storage provider is not fully implemented yet');
  }
}
