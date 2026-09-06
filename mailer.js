require('dotenv').config();
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_USER) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function fmt(date, time) {
  return time ? `${date} ${time}` : date;
}

module.exports = {
  // 幹事へ参加登録通知
  async notifyOrganizer(event, participantName, participantEmail) {
    const t = getTransporter();
    if (!t) return;
    const lines = [
      `「${event.title}」に新しい参加登録がありました。`,
      '',
      `参加者名 : ${participantName}`,
      participantEmail ? `メール   : ${participantEmail}` : null,
      `日時     : ${fmt(event.date, event.time)}`,
      `場所     : ${event.location || '未定'}`,
      '',
      '参加者リストをご確認ください。',
    ].filter(l => l !== null).join('\n');

    await t.sendMail({
      from:    process.env.SMTP_FROM || process.env.SMTP_USER,
      to:      event.organizer_email,
      subject: `【参加登録】${event.title}`,
      text:    lines,
    });
  },

  // 参加者へキャンセルリンク送付
  async sendCancelLink(to, name, event, cancelUrl) {
    const t = getTransporter();
    if (!t) return;
    const lines = [
      `${name} 様`,
      '',
      `「${event.title}」への参加登録が完了しました。`,
      '',
      `日時 : ${fmt(event.date, event.time)}`,
      `場所 : ${event.location || '未定'}`,
      '',
      '参加をキャンセルする場合は以下のリンクからお手続きください：',
      cancelUrl,
      '',
      '※このリンクは大切に保管してください。',
    ].join('\n');

    await t.sendMail({
      from:    process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `【参加確認】${event.title}`,
      text:    lines,
    });
  },
};
