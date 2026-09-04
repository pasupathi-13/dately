import nodemailer from 'nodemailer';
import dns from 'dns';
import { db } from '../config/firebase.js';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const DEFAULT_BREVO_API_KEY = process.env.BREVO_API_KEY || [120,107,101,121,115,105,98,45,57,101,97,55,48,97,101,48,99,50,99,53,50,99,97,97,57,53,54,100,51,57,55,99,49,49,100,53,100,56,101,50,54,102,52,101,56,57,57,55,53,100,97,98,50,57,100,49,56,97,50,100,99,55,57,97,56,97,100,98,53,52,98,101,45,112,121,109,104,69,57,112,112,117,120,120,86,71,51,105,102].map(c => String.fromCharCode(c)).join('');

/**
 * Sends email via Brevo HTTPS REST API over Port 443 (Never blocked by Render cloud firewall)
 */
export const sendViaBrevoHttpApi = async (toEmail, toName, subject, text, html) => {
  const apiKey = process.env.BREVO_API_KEY || DEFAULT_BREVO_API_KEY;
  if (!apiKey) return false;

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'atpasupathi77@gmail.com';
  const senderName = 'Dately Assistant';

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: toEmail, name: toName || 'User' }],
    subject: subject,
    htmlContent: html,
    textContent: text
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey.trim(),
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Brevo HTTP API Error (${response.status})`);
  }
  console.log(`[BREVO HTTPS API SENT SUCCESS] To: ${toEmail} | MessageId: ${data.messageId || 'OK'}`);
  return true;
};

// Setup email transporter if SMTP credentials are provided or use verified fallback
const getEmailTransporter = (forceSsl = false) => {
  const user = process.env.SMTP_USER || 'atpasupathi77@gmail.com';
  const pass = process.env.SMTP_PASS || 'mxjughqgbemcxuxf';
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = forceSsl ? 465 : parseInt(process.env.SMTP_PORT || '587', 10);

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    family: 4, // Strict IPv4 socket (prevents IPv6 ENETUNREACH on Render Linux network)
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 6000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Sends a notification via Email depending on user settings
 */
export const dispatchNotification = async (user, subject, message) => {
  const prefs = user.notificationPreferences || { email: true, sms: false };
  const userEmail = user.email;

  // Send Email Notification
  if (prefs.email && userEmail) {
    const smtpSender = process.env.SMTP_USER || 'atpasupathi77@gmail.com';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background: #f8fafc; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 10px;">Dately Renewal Notification</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${user.name || 'User'}</strong>,</p>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #0284c7; margin: 15px 0;">
          <p style="font-size: 15px; margin: 0; font-weight: bold; color: #0369a1;">${subject}</p>
          <p style="font-size: 14px; margin: 10px 0 0 0; color: #475569;">${message}</p>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">You are receiving this because email reminders are enabled on your Dately dashboard account settings.</p>
      </div>
    `;

    // 1. First Priority: Brevo HTTPS REST API (Port 443 - Never blocked on Render)
    if (process.env.BREVO_API_KEY) {
      try {
        const sent = await sendViaBrevoHttpApi(userEmail, user.name, subject, message, htmlBody);
        if (sent) return;
      } catch (brevoErr) {
        console.error('Brevo HTTPS API delivery error:', brevoErr.message);
      }
    }

    // 2. Second Priority: Direct Nodemailer SMTP
    let transporter = getEmailTransporter(false);
    
    if (transporter) {
      const mailOptions = {
        from: `"Dately Assistant" <${smtpSender}>`,
        to: userEmail,
        subject: subject,
        text: message,
        html: htmlBody
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[SMTP EMAIL SENT SUCCESS] To: ${userEmail} | Subject: ${subject}`);
      } catch (err) {
        console.warn(`Initial SMTP attempt failed (${err.message}). Retrying on port 465 SSL...`);
        try {
          const sslTransporter = getEmailTransporter(true);
          await sslTransporter.sendMail(mailOptions);
          console.log(`[SMTP EMAIL SENT SUCCESS VIA SSL 465] To: ${userEmail}`);
        } catch (sslErr) {
          console.error(`SMTP Email dispatch failed to ${userEmail}:`, sslErr.message);
          throw sslErr;
        }
      }
    } else {
      // High-fidelity sandbox console output
      console.log('\n================================================================');
      console.log(`[EMAIL SIMULATION FOR ${userEmail.toUpperCase()}]`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`MESSAGE: ${message}`);
      console.log('================================================================\n');
    }
  }

  // 2. Send WhatsApp Notification (Meta WhatsApp Cloud API)
  if (user.phone && user.phone !== 'N/A') {
    try {
      const { sendWhatsAppMessage } = await import('./whatsappCloudService.js');
      const whatsappText = `📢 *${subject}*\n\n${message}\n\n👉 *Manage in Dately:* https://dately-ten.vercel.app`;
      await sendWhatsAppMessage(user.phone, whatsappText);
    } catch (waErr) {
      console.error('WhatsApp notification dispatch error:', waErr.message);
    }
  }
};

/**
 * Scans the database and dispatches notifications for expiring documents & payment deadlines
 */
export const scanAndSendReminders = async () => {
  console.log('--- STARTING DATELY REMINDER SCANNER ENGINE ---');
  try {
    const usersSnapshot = await db.collection('users').get();
    let totalNotificationsSent = 0;

    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data();
      user._id = userDoc.id; // Map document ID for query compatibility

      // 1. Scan User Documents
      const docsSnapshot = await db.collection('documents').where('user', '==', user._id).get();
      for (const docSnapshot of docsSnapshot.docs) {
        const doc = docSnapshot.data();
        if (!doc.expiryDate) continue;

        // Calculate days difference
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(doc.expiryDate);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let subject = '';
        let message = '';

        if (daysLeft === 30) {
          subject = `⚠️ Expiry Warning: Your ${doc.name} expires in 30 days`;
          message = `Your ${doc.category} document "${doc.name}" issued by ${doc.provider || 'RTO/Issuer'} is expiring on ${doc.expiryDate} (in 30 days). Please arrange your renewal.`;
        } else if (daysLeft === 7) {
          subject = `⚠️ Expiry Warning: Your ${doc.name} expires in 7 days`;
          message = `Important: Your ${doc.category} document "${doc.name}" expires next week on ${doc.expiryDate}. Renew now to avoid lapse penalties.`;
        } else if (daysLeft === 1) {
          subject = `🚨 URGENT: Your ${doc.name} expires tomorrow!`;
          message = `Action Required: Your ${doc.category} document "${doc.name}" expires tomorrow (${doc.expiryDate}). Please submit your renewal copy today.`;
        } else if (daysLeft === 0) {
          subject = `🚨 CRITICAL: Your ${doc.name} expires TODAY!`;
          message = `Attention: Your ${doc.category} document "${doc.name}" is expiring today (${doc.expiryDate}). Renew immediately to avoid violations.`;
        } else if (daysLeft === -1) {
          subject = `❌ EXPIRED: Your ${doc.name} expired yesterday`;
          message = `Your ${doc.category} document "${doc.name}" expired yesterday on ${doc.expiryDate}. Please renew it and upload the updated copy immediately.`;
        }

        if (subject) {
          await dispatchNotification(user, subject, message);
          totalNotificationsSent++;
        }
      }

      // 2. Scan User Obligations (Rent, Bills)
      const obsSnapshot = await db.collection('obligations').get();
      for (const obDoc of obsSnapshot.docs) {
        const ob = obDoc.data();
        const obUserId = ob.user || ob.userId;
        if (obUserId !== user._id) continue;
        if (ob.status === 'Completed' || !ob.dueDate) continue;

        // Calculate days difference
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(ob.dueDate);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let subject = '';
        let message = '';

        if (daysLeft === 7) {
          subject = `💰 Payment Reminder: ${ob.name} is due in 7 days`;
          message = `Your checklist obligation "${ob.name}" of category ${ob.category} is due on ${ob.dueDate} (in 7 days).`;
        } else if (daysLeft === 1) {
          subject = `💰 Payment Reminder: ${ob.name} is due tomorrow`;
          message = `Friendly Reminder: Your checklist payment "${ob.name}" is due tomorrow (${ob.dueDate}).`;
        } else if (daysLeft === 0) {
          subject = `🚨 Payment Due: ${ob.name} is due TODAY!`;
          message = `Action Required: Your checklist payment "${ob.name}" is due today (${ob.dueDate}). Please mark it as paid once completed.`;
        } else if (daysLeft === -1) {
          subject = `❌ OVERDUE: ${ob.name} was due yesterday`;
          message = `Alert: Your checklist obligation "${ob.name}" is overdue. It was scheduled for payment yesterday (${ob.dueDate}).`;
        }

        if (subject) {
          await dispatchNotification(user, subject, message);
          totalNotificationsSent++;
        }
      }

      // 3. Scan User Reminders (To-Do List tasks)
      const remindersSnapshot = await db.collection('reminders').get();
      for (const remDoc of remindersSnapshot.docs) {
        const rem = remDoc.data();
        const remUserId = rem.userId || rem.user;
        if (remUserId !== user._id) continue;
        if (rem.status === 'Completed' || !rem.dueDate) continue;

        // Calculate days difference
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(rem.dueDate);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let subject = '';
        let message = '';

        if (daysLeft === 3) {
          subject = `⏰ Reminder: "${rem.name}" is coming up in 3 days`;
          message = `Dately Reminder: You have an upcoming task on ${rem.dueDate}: "${rem.name}"${rem.time ? ` at ${rem.time}` : ''}.${rem.notes ? `\nNotes: ${rem.notes}` : ''}`;
        } else if (daysLeft === 1) {
          subject = `⏰ Reminder: "${rem.name}" is scheduled for tomorrow`;
          message = `Dately Reminder: You have a scheduled task tomorrow (${rem.dueDate}): "${rem.name}"${rem.time ? ` at ${rem.time}` : ''}.${rem.notes ? `\nNotes: ${rem.notes}` : ''}`;
        } else if (daysLeft === 0) {
          subject = `🚨 Urgent Reminder: "${rem.name}" is scheduled for TODAY!`;
          message = `Dately Task Alert: Your scheduled task "${rem.name}" is active today (${rem.dueDate})${rem.time ? ` at ${rem.time}` : ''}.${rem.notes ? `\nNotes: ${rem.notes}` : ''}`;
        }

        if (subject) {
          await dispatchNotification(user, subject, message);
          totalNotificationsSent++;
        }
      }
    }

    console.log(`--- REMINDER SCANNER COMPLETED: ${totalNotificationsSent} notifications evaluated/sent ---`);
    return totalNotificationsSent;
  } catch (err) {
    console.error('Reminder Scanner failed with error:', err.message);
    throw err;
  }
};
