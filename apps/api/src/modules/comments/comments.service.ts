import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comments.entity';
import { CommentReply } from './entities/comment_replies.entity';
import { TasksService } from '../tasks/tasks.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { ProjectMemberRole } from '@mesh/shared';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(CommentReply)
    private readonly replyRepo: Repository<CommentReply>,
    private readonly tasksService: TasksService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) { }

  private async parseAndNotifyMentions(taskId: string, body: string, actorId: string) {
    const mentions = Array.from(body.matchAll(/@(\w+)/g)).map(m => m[1]);
    if (mentions.length > 0) {
      const uniqueNames = [...new Set(mentions)];
      const users = await this.usersService.findUsersByNames(uniqueNames);
      for (const user of users) {
        await this.notificationsService.createMentionNotification(taskId, user.id, actorId).catch(console.error);
      }
    }
  }

  async create(userId: string, dto: CreateCommentDto): Promise<any> {
    const task = await this.tasksService.findOne(dto.taskId, userId); // Verifies access

    const comment = this.commentRepo.create({
      taskId: dto.taskId,
      authorId: userId,
      body: dto.body,
      canvasX: dto.canvasX,
      canvasY: dto.canvasY,
    });

    const saved = await this.commentRepo.save(comment);

    // Mentions
    await this.parseAndNotifyMentions(dto.taskId, dto.body, userId);

    // Task assignee notification
    if (task.assigneeId && task.assigneeId !== userId) {
      await this.notificationsService.createCommentNotification(dto.taskId, task.assigneeId, userId).catch(console.error);
    }

    const fetched = await this.commentRepo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });

    return { ...fetched, replies: [] };
  }

  async findAll(taskId: string, userId: string): Promise<any[]> {
    await this.tasksService.findOne(taskId, userId); // Verifies access

    const comments = await this.commentRepo.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.taskId = :taskId', { taskId })
      .orderBy('comment.createdAt', 'ASC')
      .getMany();

    if (comments.length === 0) return [];

    const commentIds = comments.map(c => c.id);
    const replies = await this.replyRepo.createQueryBuilder('reply')
      .leftJoinAndSelect('reply.author', 'author')
      .where('reply.commentId IN (:...commentIds)', { commentIds })
      .orderBy('reply.createdAt', 'ASC')
      .getMany();

    return comments.map(c => ({
      ...c,
      author: c.author,
      replies: replies.filter(r => r.commentId === c.id),
    }));
  }

  async createReply(commentId: string, userId: string, dto: CreateReplyDto): Promise<any> {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    await this.tasksService.findOne(comment.taskId, userId); // Verifies access

    const reply = this.replyRepo.create({
      commentId,
      authorId: userId,
      body: dto.body,
    });
    const saved = await this.replyRepo.save(reply);

    // Mentions
    await this.parseAndNotifyMentions(comment.taskId, dto.body, userId);

    // Notify original author
    if (comment.authorId !== userId) {
      await this.notificationsService.createMentionNotification(comment.taskId, comment.authorId, userId).catch(console.error);
    }

    return this.replyRepo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });
  }

  async resolve(commentId: string, userId: string): Promise<Comment> {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    await this.tasksService.findOne(comment.taskId, userId); // Verifies access

    comment.resolvedAt = new Date();
    return this.commentRepo.save(comment);
  }

  async unresolve(commentId: string, userId: string): Promise<Comment> {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    await this.tasksService.findOne(comment.taskId, userId); // Verifies access

    comment.resolvedAt = null as any;
    return this.commentRepo.save(comment);
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    const task = await this.tasksService.findOne(comment.taskId, userId); // Verifies reading access

    // Check delete permission (Author or admin)
    // To check if they are project admin, we need projectsService OR we assume findOne gives us what we need.
    // Actually tasksService.delete checks for Admin via projectsService.
    // I can inject projectsService here or use a helper on tasksService.
    // The prompt says "Only comment author or project admin can delete"

    let isProjectAdmin = false;
    try {
      const projAccess = await (this.tasksService as any).projectsService?.checkAccess(task.projectId, userId);
      if (projAccess?.role === ProjectMemberRole.Admin) {
        isProjectAdmin = true;
      }
    } catch (e: unknown) {
      console.error(e);
    }

    if (comment.authorId !== userId && !isProjectAdmin) {
      throw new ForbiddenException('Only the author or a project admin can delete this comment');
    }

    await this.commentRepo.remove(comment);
  }
}
