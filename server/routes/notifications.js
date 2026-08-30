import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { scanAndSendReminders, dispatchNotification } from '../services/notificationService.js';

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

// @desc    Send a direct test email to verify SMTP settings
// @route   POST /api/notifications/test-email
// @access  Private
router.post('/test-email', protect, async (req, res) => {
  try {
    const subject = '📧 Dately Connection Test Email';
    const message = `Hello ${req.user.name || 'User'},\n\nCongratulations! This is a test email sent from Dately to verify that your Brevo SMTP connection is working perfectly. Your automated notification vault is now fully operational!\n\nBest regards,\nThe Dately Team`;
    
    await dispatchNotification(req.user, subject, message);
    
    res.json({
      message: 'Test email sent successfully.',
      recipient: req.user.email
    });
  } catch (error) {
    console.error('Test email error:', error.message);
    res.status(400).json({
      message: `Email sending failed (${error.message}). Please verify your SMTP_USER and SMTP_PASS in Render environment variables.`,
      error: error.message
    });
  }
});

export default router;
