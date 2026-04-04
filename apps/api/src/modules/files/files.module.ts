import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { S3StorageProvider } from './storage/s3.provider';
import { AzureStorageProvider } from './storage/azure.provider';
import { CloudinaryStorageProvider } from './storage/cloudinary.provider';

const storageProviderFactory = {
  provide: 'STORAGE_PROVIDER',
  useFactory: (configService: ConfigService) => {
    const providerInfo = configService.get('STORAGE_PROVIDER', 's3');
    switch (providerInfo.toLowerCase()) {
      case 'azure':
        return new AzureStorageProvider(configService);
      case 'cloudinary':
        return new CloudinaryStorageProvider(configService);
      case 's3':
      default:
        return new S3StorageProvider(configService);
    }
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  controllers: [FilesController],
  providers: [FilesService, storageProviderFactory],
  exports: [FilesService],
})
export class FilesModule {}
