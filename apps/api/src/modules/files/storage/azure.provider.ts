import { IStorageProvider } from './storage.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

@Injectable()
export class AzureStorageProvider implements IStorageProvider {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly containerName: string;

  constructor(private readonly configService: ConfigService) {
    const accountName = this.configService.get('AZURE_BLOB_ACCOUNT_NAME') || '';
    const accountKey = this.configService.get('AZURE_BLOB_ACCESS_KEY') || '';
    // Use AZURE_BLOB_CONTAINER, fallback to R2_BUCKET, then generic 'mesh-data'
    this.containerName = this.configService.get('AZURE_BLOB_CONTAINER') || this.configService.get('R2_BUCKET') || 'mesh-data';

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
  }

  async uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });

    return blockBlobClient.url;
  }
}
