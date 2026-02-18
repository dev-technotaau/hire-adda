import prisma from '../config/prisma';
import { emailService } from './email.service';
import { ticketService } from './ticket.service';
import logger from '../config/logger';

class ContactService {
    async submitMessage(data: { name: string; email: string; subject: string; message: string }) {
        const contact = await prisma.contactMessage.create({ data });

        // Also create a SupportTicket for tracking (fire-and-forget)
        ticketService.createGuestTicket({
            name: data.name,
            email: data.email,
            subject: data.subject,
            description: data.message,
        }).catch((err) => logger.warn('Failed to create support ticket from contact form', { error: err }));

        // Notify admins via email (fire-and-forget)
        emailService.sendEmail({
            to: 'support@talentbridge.com',
            subject: `[Contact Form] ${data.subject} — from ${data.name}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Subject:</strong> ${data.subject}</p>
                <hr />
                <p>${data.message.replace(/\n/g, '<br />')}</p>
                <hr />
                <p style="color: #888; font-size: 12px;">Message ID: ${contact.id}</p>
            `,
        }).catch((err) => logger.warn('Failed to send contact notification email', { error: err }));

        return contact;
    }

    async listMessages(page: number, limit: number, isRead?: boolean) {
        const where = isRead !== undefined ? { isRead } : {};
        const [items, total] = await Promise.all([
            prisma.contactMessage.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.contactMessage.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async markAsRead(id: string) {
        return prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
    }

    async deleteMessage(id: string) {
        return prisma.contactMessage.delete({ where: { id } });
    }
}

export const contactService = new ContactService();
