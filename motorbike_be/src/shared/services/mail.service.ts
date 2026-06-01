import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendAppointmentConfirmation(to: string, data: {
    customerName: string;
    appointmentTime: Date;
    serviceName?: string;
    symptoms?: string;
  }) {
    const dateStr = new Date(data.appointmentTime).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: 'Xác nhận đặt lịch - Shop2Bánh',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #c0392b; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">Shop2Bánh</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #e0e0e0;">
            <p>Xin chào <strong>${data.customerName}</strong>,</p>
            <p>Lịch hẹn của bạn đã được đặt thành công. Chúng tôi sẽ liên hệ xác nhận sớm nhất.</p>
            <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Thời gian:</strong> ${dateStr}</p>
              ${data.symptoms ? `<p style="margin: 4px 0;"><strong>Yêu cầu:</strong> ${data.symptoms}</p>` : ''}
            </div>
            <p style="color: #888; font-size: 13px;">Nếu bạn cần thay đổi lịch hẹn, vui lòng liên hệ chúng tôi.</p>
          </div>
        </div>
      `,
    });
  }
}