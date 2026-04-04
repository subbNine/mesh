import { Injectable, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/users.entity';
import { IStorageProvider } from '../files/storage/storage.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import * as path from 'node:path';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: IStorageProvider,
  ) {}

  async findUsersByNames(userNames: string[]): Promise<User[]> {
    if (!userNames || userNames.length === 0) return [];
    return this.userRepo.find({
      where: { userName: In(userNames) },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findMe(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findMe(userId);

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;

    return this.userRepo.save(user);
  }

  async updateAvatar(userId: string, file: Express.Multer.File): Promise<User> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      throw new BadRequestException('Avatar size must not exceed 1MB');
    }

    const user = await this.findMe(userId);

    // 1. Delete old avatar if it exists in Azure
    if (user.avatarUrl) {
      try {
        // Extract key from URL if it's our Azure URL
        // Example: https://{account}.blob.core.windows.net/container/avatars/userid.png
        const urlParts = user.avatarUrl.split('/');
        const key = `avatars/${urlParts.at(-1)}`;
        await this.storageProvider.deleteFile(key).catch(e => console.error('Failed to delete old avatar', e));
      } catch (e) {
        console.warn('Could not parse old avatar URL for deletion', e);
      }
    }

    // 2. Upload new avatar
    const ext = path.extname(file.originalname) || '.png';
    const key = `avatars/${userId}${ext}`;
    const url = await this.storageProvider.uploadFile(key, file.buffer, file.mimetype);

    // 3. Update DB
    user.avatarUrl = url;
    return this.userRepo.save(user);
  }
}
