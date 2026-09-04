import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { scanAndSendReminders, dispatchNotification } from '../services/notificationService.js';
import { sendWhatsAppMessage } from '../services/whatsappCloudService.js';

const router = express.Router();

// @desc    Manually trigger document and obligation reminder scan
// @route   POST /api/notifications/trigger
// @access  Private
router.post('/trigger', protect, async (req, res) => {
  try {
    const totalSent = await scanAndSendReminders();
    res.json({
      message: 'Reminder scanning loop completed.',
      notificationsSent: totalSent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send a direct test email to verify settings
// @route   POST /api/notifications/test-email
// @access  Private
router.post('/test-email', protect, async (req, res) => {
  try {
    const subject = '📧 Dately Connection Test Email';
    const message = `Hello ${req.user.name || 'User'},\n\nCongratulations! This is a test email sent from Dately to verify that your Brevo HTTPS email connection is working perfectly. Your automated notification vault is fully operational!\n\nBest regards,\nThe Dately Team`;
    
    await dispatchNotification(req.user, subject, message);
    
    res.json({
      message: 'Test email sent successfully.',
      recipient: req.user.email
    });
  } catch (error) {
    console.error('Test email error:', error.message);
    res.status(400).json({
      message: `Email sending failed (${error.message}).`,
      error: error.message
    });
  }
});

// @desc    Send a direct test WhatsApp message
// @route   POST /api/notifications/test-whatsapp
// @access  Private
router.post('/test-whatsapp', protect, async (req, res) => {
  try {
    const targetPhone = req.body.phone || req.user.phone;
    if (!targetPhone || targetPhone === 'N/A') {
      return res.status(400).json({ message: 'A valid mobile number is required in your profile to send WhatsApp alerts.' });
    }

    const testMessage = `🤖 *DATELY WHATSAPP GATEWAY TEST*\n\nHello *${req.user.name || 'User'}*,\n\n🎉 Congratulations! Your Dately Meta WhatsApp Cloud integration is connected and working!\n\nYou will receive real-time deadline warnings and To-Do reminders directly in this chat.\n\n_Dately Notification Engine_`;

    const result = await sendWhatsAppMessage(targetPhone, testMessage);
    if (!result || !result.success) {
      const errorDetail = result?.error || 'WhatsApp message dispatch failed.';
      return res.status(400).json({
        message: errorDetail.includes('Recipient phone number not in allowed list')
          ? 'Meta Sandbox Security: Please add your phone number to the "To" allowed list in Meta for Developers (API Setup) first.'
          : errorDetail,
        error: errorDetail
      });
    }

    res.json({
      message: 'Test WhatsApp message sent successfully!',
      recipient: targetPhone,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Test WhatsApp error:', error.message);
    res.status(400).json({
      message: `WhatsApp message failed (${error.message}).`,
      error: error.message
    });
  }
});

export default router;
