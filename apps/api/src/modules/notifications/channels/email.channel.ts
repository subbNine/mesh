import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { INotificationChannel, NotificationPayload } from './channel.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class EmailChannel implements INotificationChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private readonly transporter: nodemailer.Transporter;
  private templateCache: Record<string, handlebars.TemplateDelegate> = {};

  constructor(private readonly usersService: UsersService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async getTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    if (this.templateCache[templateName]) {
      return this.templateCache[templateName];
    }
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.hbs`);
    try {
      const templateString = await fs.readFile(templatePath, 'utf-8');
      const compiled = handlebars.compile(templateString);
      this.templateCache[templateName] = compiled;
      return compiled;
    } catch (e) {
      this.logger.error(`Failed to load template ${templateName}`, e);
      throw e;
    }
  }

  async send(payload: NotificationPayload): Promise<void> {
    const user = await this.usersService.findById(payload.recipientId);
    if (!user?.email) {
      this.logger.warn(`User ${payload.recipientId} not found or missing email`);
      return;
    }

    let templateName: string | null = null;
    if (payload.type === 'assigned') {
      templateName = 'assigned';
    } else if (payload.type === 'mentioned') {
      templateName = 'mentioned';
    }

    if (!templateName) {
      this.logger.warn(`No email template configured for notification type ${payload.type}`);
      return;
    }

    const template = await this.getTemplate(templateName);
    const html = template({
      userName: user.firstName ? `${user.firstName} ${user.lastName}` : user.userName,
      taskUrl: `${process.env.WEB_URL || 'http://localhost:5173'}/projects/${payload.resourceId}`, // fallback generic, adjust if needed
      ...payload.data
    });

    if (!process.env.SMTP_USER) {
      this.logger.log(`Mock Email to: ${user.email} | Type: ${payload.type} | Content: ${html.substring(0, 100)}...`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Mesh Notifications" <no-reply@mesh.app>',
      to: user.email,
      subject: payload.type === 'assigned' ? 'New Task Assignment' : 'You were mentioned',
      html,
    });
    this.logger.log(`Email sent to ${user.email}`);
  }
}
