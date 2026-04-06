import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import { ProjectFile } from './entities/project-files.entity';
import { ProjectFolder } from '../docs/entities/project-folders.entity';
import { ProjectsService } from '../projects/projects.service';
import { IStorageProvider } from '../files/storage/storage.interface';
import { ProjectMemberRole } from '@mesh/shared';
import { UpdateProjectFileDto } from './dto/update-project-file.dto';

@Injectable()
export class ProjectFilesService {
  constructor(
    @Inject('STORAGE_PROVIDER') private readonly storageProvider: IStorageProvider,
    @InjectRepository(ProjectFile)
    private readonly projectFileRepo: Repository<ProjectFile>,
    @InjectRepository(ProjectFolder)
    private readonly folderRepo: Repository<ProjectFolder>,
    private readonly projectsService: ProjectsService,
  ) {}

  async upload(projectId: string, userId: string, files: Express.Multer.File[], folderId?: string) {
    await this.projectsService.checkAccess(projectId, userId);

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    if (folderId) {
      await this.getFolderOrThrow(projectId, folderId);
    }

    const maxSize = 50 * 1024 * 1024;

    const createdFiles = await Promise.all(
      files.map(async (file) => {
        if (file.size > maxSize) {
          throw new BadRequestException(`${file.originalname} exceeds the 50MB file size limit`);
        }

        const ext = path.extname(file.originalname);
        const key = `project-files/${projectId}/${randomUUID()}${ext}`;
        const url = await this.storageProvider.uploadFile(
          key,
          file.buffer,
          file.mimetype || 'application/octet-stream',
        );

        const record = this.projectFileRepo.create({
          projectId,
          folderId: folderId ?? null,
          name: file.originalname,
          url,
          key,
          mimeType: file.mimetype || 'application/octet-stream',
          sizeBytes: file.size,
          uploaderId: userId,
        });

        return this.projectFileRepo.save(record);
      }),
    );

    return this.projectFileRepo.find({
      where: { id: In(createdFiles.map((file) => file.id)) },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  async rename(projectId: string, fileId: string, userId: string, dto: UpdateProjectFileDto) {
    const { role } = await this.projectsService.checkAccess(projectId, userId);
    const file = await this.projectFileRepo.findOne({
      where: { id: fileId, projectId },
      relations: ['uploader'],
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.uploaderId !== userId && role !== ProjectMemberRole.Admin) {
      throw new ForbiddenException('Only the uploader or a project admin can rename this file');
    }

    file.name = dto.name.trim();
    return this.projectFileRepo.save(file);
  }

  async delete(projectId: string, fileId: string, userId: string) {
    const { role } = await this.projectsService.checkAccess(projectId, userId);
    const file = await this.projectFileRepo.findOne({ where: { id: fileId, projectId } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.uploaderId !== userId && role !== ProjectMemberRole.Admin) {
      throw new ForbiddenException('Only the uploader or a project admin can delete this file');
    }

    try {
      await this.storageProvider.deleteFile(file.key);
    } catch (error) {
      console.error('Failed to delete project file from storage', error);
    }

    await this.projectFileRepo.remove(file);
  }

  private async getFolderOrThrow(projectId: string, folderId: string) {
    const folder = await this.folderRepo.findOne({ where: { id: folderId, projectId } });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }
}
