import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as multer from 'multer';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { S3StorageProvider } from './storage/s3.provider';
import { AzureStorageProvider } from './storage/azure.provider';
import { CloudinaryStorageProvider } from './storage/cloudinary.provider';
import { File } from './entities/files.entity';

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
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([File]),
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, storageProviderFactory],
  exports: [FilesService],
})
export class FilesModule {}
