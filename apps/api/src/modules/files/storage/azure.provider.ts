import { IStorageProvider } from './storage.interface';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

@Injectable()
export class AzureStorageProvider implements IStorageProvider, OnModuleInit {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly containerName: string;

  constructor(private readonly configService: ConfigService) {
    const accountName = this.configService.get('AZURE_BLOB_ACCOUNT_NAME') || '';
    const accountKey = this.configService.get('AZURE_BLOB_ACCESS_KEY') || '';
    this.containerName = this.configService.get('AZURE_BLOB_CONTAINER') || this.configService.get('R2_BUCKET') || 'mesh-data';

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
  }

  async onModuleInit() {
    await this.configureCors();
  }

  private async configureCors() {
    try {
      const allowedOrigins = this.configService.get('CORS_ALLOWED_ORIGINS') || '*';
      await this.blobServiceClient.setProperties({
        cors: [{
          allowedOrigins,
          allowedMethods: 'GET,OPTIONS',
          allowedHeaders: '*',
          exposedHeaders: '*',
          maxAgeInSeconds: 3600
        }]
      });
      console.log(`[Azure] CORS configured for: ${allowedOrigins}`);
    } catch (err) {
      console.warn('[Azure] Failed to configure CORS service properties', err.message);
    }
  }

  async uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });

    return blockBlobClient.url;
  }

  async deleteFile(key: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    await blockBlobClient.deleteIfExists();
  }
}
