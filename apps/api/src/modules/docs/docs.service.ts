import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ProjectsService } from '../projects/projects.service';
import { ProjectMemberRole } from '@mesh/shared';
import { ProjectDocument } from './entities/project-documents.entity';
import { ProjectFolder } from './entities/project-folders.entity';
import { ProjectFile } from '../project-files/entities/project-files.entity';
import { CreateProjectFolderDto } from './dto/create-project-folder.dto';
import { CreateProjectDocumentDto } from './dto/create-project-document.dto';
import { UpdateProjectDocumentDto } from './dto/update-project-document.dto';
import { MoveProjectLibraryItemDto } from './dto/move-project-library-item.dto';

@Injectable()
export class DocsService {
  constructor(
    @InjectRepository(ProjectDocument)
    private readonly documentRepo: Repository<ProjectDocument>,
    @InjectRepository(ProjectFolder)
    private readonly folderRepo: Repository<ProjectFolder>,
    @InjectRepository(ProjectFile)
    private readonly projectFileRepo: Repository<ProjectFile>,
    private readonly projectsService: ProjectsService,
  ) {}

  async getLibrary(projectId: string, userId: string, folderId?: string) {
    await this.projectsService.checkAccess(projectId, userId);

    const currentFolder = folderId
      ? await this.getFolderOrThrow(projectId, folderId)
      : null;

    const folderWhere = currentFolder ? currentFolder.id : IsNull();

    const [folders, documents, files] = await Promise.all([
      currentFolder ? Promise.resolve([]) : this.getFoldersWithCounts(projectId),
      this.documentRepo.find({
        where: { projectId, folderId: folderWhere },
        relations: ['author'],
        order: { updatedAt: 'DESC' },
      }),
      this.projectFileRepo.find({
        where: { projectId, folderId: folderWhere },
        relations: ['uploader'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      currentFolder,
      folders,
      documents,
      files,
    };
  }

  async createFolder(projectId: string, userId: string, dto: CreateProjectFolderDto) {
    await this.projectsService.checkAccess(projectId, userId);

    const folder = this.folderRepo.create({
      projectId,
      name: dto.name.trim(),
      createdBy: userId,
    });

    const saved = await this.folderRepo.save(folder);
    return { ...saved, itemCount: 0 };
  }

  async deleteFolder(projectId: string, folderId: string, userId: string) {
    const { role } = await this.projectsService.checkAccess(projectId, userId);
    const folder = await this.getFolderOrThrow(projectId, folderId);

    if (folder.createdBy !== userId && role !== ProjectMemberRole.Admin) {
      throw new ForbiddenException('Only the folder creator or a project admin can delete this folder');
    }

    await Promise.all([
      this.documentRepo.update({ projectId, folderId }, { folderId: null }),
      this.projectFileRepo.update({ projectId, folderId }, { folderId: null }),
    ]);

    await this.folderRepo.remove(folder);
  }

  async createDocument(projectId: string, userId: string, dto: CreateProjectDocumentDto) {
    await this.projectsService.checkAccess(projectId, userId);

    if (dto.folderId) {
      await this.getFolderOrThrow(projectId, dto.folderId);
    }

    const document = this.documentRepo.create({
      projectId,
      folderId: dto.folderId ?? null,
      title: dto.title?.trim() || 'Untitled document',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
      authorId: userId,
    });

    const saved = await this.documentRepo.save(document);
    return { id: saved.id, title: saved.title };
  }

  async getDocument(projectId: string, documentId: string, userId: string) {
    await this.projectsService.checkAccess(projectId, userId);

    const document = await this.documentRepo.findOne({
      where: { id: documentId, projectId },
      relations: ['author'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async updateDocument(projectId: string, documentId: string, userId: string, dto: UpdateProjectDocumentDto) {
    await this.projectsService.checkAccess(projectId, userId);

    const document = await this.documentRepo.findOne({
      where: { id: documentId, projectId },
      relations: ['author'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (dto.title !== undefined) {
      document.title = dto.title.trim() || 'Untitled document';
    }

    if (dto.content !== undefined) {
      document.content = dto.content;
    }

    return this.documentRepo.save(document);
  }

  async deleteDocument(projectId: string, documentId: string, userId: string) {
    const { role } = await this.projectsService.checkAccess(projectId, userId);
    const document = await this.documentRepo.findOne({
      where: { id: documentId, projectId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.authorId !== userId && role !== ProjectMemberRole.Admin) {
      throw new ForbiddenException('Only the author or a project admin can delete this document');
    }

    await this.documentRepo.remove(document);
  }

  async moveItem(projectId: string, userId: string, dto: MoveProjectLibraryItemDto) {
    await this.projectsService.checkAccess(projectId, userId);

    const folderId = dto.folderId ?? null;

    if (folderId) {
      await this.getFolderOrThrow(projectId, folderId);
    }

    if (dto.itemType === 'document') {
      const document = await this.documentRepo.findOne({ where: { id: dto.itemId, projectId } });
      if (!document) {
        throw new NotFoundException('Document not found');
      }
      document.folderId = folderId;
      return this.documentRepo.save(document);
    }

    const file = await this.projectFileRepo.findOne({ where: { id: dto.itemId, projectId } });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    file.folderId = folderId;
    return this.projectFileRepo.save(file);
  }

  private async getFolderOrThrow(projectId: string, folderId: string) {
    const folder = await this.folderRepo.findOne({ where: { id: folderId, projectId } });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  private async getFoldersWithCounts(projectId: string) {
    const folders = await this.folderRepo.find({
      where: { projectId },
      order: { createdAt: 'ASC' },
    });

    return Promise.all(
      folders.map(async (folder) => {
        const [documentCount, fileCount] = await Promise.all([
          this.documentRepo.count({ where: { projectId, folderId: folder.id } }),
          this.projectFileRepo.count({ where: { projectId, folderId: folder.id } }),
        ]);

        return {
          ...folder,
          itemCount: documentCount + fileCount,
        };
      }),
    );
  }
}
