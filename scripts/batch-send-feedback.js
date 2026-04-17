/**
 * 批量发送模拟用户反馈邮件
 * 使用 nodemailer 通过 SMTP 发送
 *
 * 使用方法: node scripts/batch-send-feedback.js
 *
 * SMTP 配置说明:
 * - 如果使用 QQ 邮箱/企业邮箱: 主机 smtp.qq.com / smtp.exmail.qq.com，端口 465
 * - 需要在邮箱设置中开启 SMTP 服务并获取授权码
 */

import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== SMTP 配置（请修改为你的配置） ==========
const SMTP_CONFIG = {
  host: 'gz-smtp.qcloudmail.com', // SMTP 主机
  port: 465, // 端口（465 为 SSL）
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'support@hpvsc.icu', // 发件人邮箱
    pass: 'XingranYA68', // SMTP 密码/授权码
  },
};

// ========== 邮件配置 ==========
const EMAIL_CONFIG = {
  from: '"CervixDetectAI 系统" <support@hpvsc.icu>',
  to: 'support@mail.hpvsc.icu',     // 收件邮箱
  subjectPrefix: '【用户反馈】',
  feedbackFile: path.join(__dirname, '../test-feedbacks.json'),
  sendInterval: 1000,                    // 发送间隔（毫秒），30秒避免触发反垃圾策略
  enableSend: true                        // true=实际发送，false=仅模拟
};

// ========== 生成邮件HTML模板 ==========
function generateEmailHtml(feedback) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa; color: #333; line-height: 1.6; }
    .container { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .subject { font-size: 18px; font-weight: 500; margin: 0 0 16px 0; color: #1a1a1a; }
    .body { font-size: 15px; color: #444; margin: 0 0 20px 0; white-space: pre-wrap; }
    .footer { border-top: 1px solid #eee; padding-top: 12px; margin-top: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h2 class="subject">${feedback.subject}</h2>
    <div class="body">${feedback.body}</div>
    <div class="footer">
      <p>反馈编号 #${feedback.id}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ========== 创建邮件传输器 ==========
function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: {
      user: SMTP_CONFIG.auth.user,
      pass: SMTP_CONFIG.auth.pass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000
  });
}

// ========== 发送邮件 ==========
async function sendEmail(transporter, subject, html) {
  return transporter.sendMail({
    from: EMAIL_CONFIG.from,
    to: EMAIL_CONFIG.to,
    subject: EMAIL_CONFIG.subjectPrefix + subject,
    html: html
  });
}

// ========== 主函数 ==========
async function main() {
  console.log('🚀 批量发送反馈邮件脚本启动');
  console.log('='.repeat(50));
  console.log(`📧 发件人: ${SMTP_CONFIG.auth.user}`);
  console.log(`📥 收件人: ${EMAIL_CONFIG.to}`);
  console.log(`⏱️ 发送间隔: ${EMAIL_CONFIG.sendInterval}ms`);

  if (EMAIL_CONFIG.enableSend) {
      console.log('⚠️ 实际发送模式');
    } else {
      console.log('⚡ 模拟模式（不会实际发送邮件）');
    }
    console.log('='.repeat(50));

  // 读取反馈数据
  let feedbacks;
  try {
    const data = fs.readFileSync(EMAIL_CONFIG.feedbackFile, 'utf-8');
    feedbacks = JSON.parse(data);
    console.log(`📋 加载了 ${feedbacks.length} 条反馈数据\n`);
  } catch (err) {
    console.error('❌ 读取反馈文件失败:', err.message);
    process.exit(1);
  }

  const transporter = createTransporter();
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < feedbacks.length; i++) {
    const feedback = feedbacks[i];
    const subject = feedback.subject;

    console.log(`[${i + 1}/${feedbacks.length}] ${subject}`);

    if (EMAIL_CONFIG.enableSend) {
      // 重试机制：最多重试2次
      let retries = 0;
      let sent = false;

      while (retries < 3 && !sent) {
        try {
          const html = generateEmailHtml(feedback);
          await sendEmail(transporter, subject, html);
          console.log(`  ✅ 发送成功`);
          successCount++;
          sent = true;
        } catch (err) {
          retries++;
          if (retries < 3) {
            console.log(`  ⚠️ 发送失败，${3 - retries}秒后重试 (${retries}/2): ${err.message}`);
            await new Promise(r => setTimeout(r, 3000));
            // 重连SMTP
            transporter.close();
            Object.assign(transporter, createTransporter());
          } else {
            console.log(`  ❌ 发送失败: ${err.message}`);
            failCount++;
          }
        }
      }
    } else {
      console.log(`  ⚡ [模拟] ${feedback.body.substring(0, 60)}...`);
      successCount++;
    }

    // 发送间隔
    if (i < feedbacks.length - 1) {
      await new Promise(r => setTimeout(r, EMAIL_CONFIG.sendInterval));
    }
  }

  // 关闭连接
  transporter.close();

  console.log('\n' + '='.repeat(50));
  console.log(`📊 发送完成: 成功 ${successCount}, 失败 ${failCount}`);
  console.log(`📧 收件箱: ${EMAIL_CONFIG.to}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
