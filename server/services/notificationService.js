import nodemailer from 'nodemailer';
import { db } from '../config/firebase.js';
import whatsappClient from '../config/whatsapp.js';

// Setup email transporter if SMTP credentials are provided
const getEmailTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null; // Run in sandbox simulation mode
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

/**
 * Sends a notification via Email and/or SMS depending on user settings
 */
export const dispatchNotification = async (user, subject, message) => {
  const prefs = user.notificationPreferences || { email: true, sms: true };
  const userEmail = user.email;
  let userPhone = user.phone || 'N/A';
  if (userPhone !== 'N/A') {
    userPhone = userPhone.trim();
    if (userPhone.length === 10 && !userPhone.startsWith('+')) {
      userPhone = `+91${userPhone}`;
    } else if (userPhone.length === 12 && userPhone.startsWith('91')) {
      userPhone = `+${userPhone}`;
    }
  }

  // 1. Send Email Notification
  if (prefs.email && userEmail) {
    const transporter = getEmailTransporter();
    
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Dately Assistant" <${process.env.SMTP_USER}>`,
          to: userEmail,
          subject: subject,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background: #f8fafc; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
              <h2 style="color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 10px;">Dately Renewal Notification</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${user.name || 'User'}</strong>,</p>
              <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #0284c7; margin: 15px 0;">
                <p style="font-size: 15px; margin: 0; font-weight: bold; color: #0369a1;">${subject}</p>
                <p style="font-size: 14px; margin: 10px 0 0 0; color: #475569;">${message}</p>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 20px;">You are receiving this because email reminders are enabled on your Dately dashboard account settings.</p>
            </div>
          `
        });
        console.log(`[SMTP EMAIL SENT SUCCESS] To: ${userEmail} | Subject: ${subject}`);
      } catch (err) {
        console.error(`SMTP Email dispatch failed to ${userEmail}:`, err.message);
        throw err;
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

  // 2. Send WhatsApp Notification (mapped to prefs.sms / prefs.whatsapp)
  if (prefs.sms && userPhone && userPhone !== 'N/A') {
    try {
      let cleanNumber = userPhone.replace('+', '').replace(/\s/g, '');
      if (cleanNumber.length === 10) {
        cleanNumber = `91${cleanNumber}`;
      }
      const chatId = `${cleanNumber}@c.us`;
      await whatsappClient.sendMessage(chatId, `Dately Alert! *${subject}*\n\n${message}`);
      console.log(`[WHATSAPP WEB SENT SUCCESS] To: ${cleanNumber} | Msg: ${message}`);
    } catch (err) {
      console.error(`WhatsApp Web dispatch failed to ${userPhone}:`, err.message);
      console.log('\n================================================================');
      console.log(`[WHATSAPP SIMULATION FALLBACK FOR ${userPhone}]`);
      console.log(`BODY: Dately Alert! *${subject}*\n\n${message}`);
      console.log('================================================================\n');
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

      // 2. Scan User Obligations (Rent, Bills) - filter status completed in JS to avoid creating indexes
      const obsSnapshot = await db.collection('obligations').where('user', '==', user._id).get();
      for (const obDoc of obsSnapshot.docs) {
        const ob = obDoc.data();
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
      const remindersSnapshot = await db.collection('reminders').where('userId', '==', user._id).get();
      for (const remDoc of remindersSnapshot.docs) {
        const rem = remDoc.data();
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

        if (daysLeft === 1) {
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
