import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/firebase.js';
import { protect } from '../middleware/authMiddleware.js';
import { google } from 'googleapis';
import { checkDriveStorage } from '../services/driveService.js';

const router = express.Router();

// Generate JWT Helper
const JWT_SECRET = process.env.JWT_SECRET || 'dately_secure_jwt_secret_key_2026_!@#';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    const userSnapshot = await db.collection('users').where('email', '==', email.toLowerCase()).get();

    if (!userSnapshot.empty) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      onboarded: false,
      notificationPreferences: {
        email: true,
        sms: true,
        push: true,
        voiceCalls: false,
        voiceCallsCriticalOnly: true
      },
      googleConnected: false,
      googleDriveSimulatedQuotaUsed: 13421772800, // 12.5 GB in bytes
      googleDriveSimulatedQuotaTotal: 16106127360, // 15 GB in bytes
      googleDriveForceQuotaExceeded: false,
      googleTokens: null,
      googleDriveFolderId: '',
      createdAt: new Date().toISOString()
    };

    const userDocRef = await db.collection('users').add(newUser);
    const userId = userDocRef.id;

    // Send Welcome Email to the newly registered email address
    try {
      const { dispatchNotification } = await import('../services/notificationService.js');
      const subject = 'Welcome to Dately! 🎉';
      const welcomeMessage = `Hello ${name},\n\nWelcome to Dately! Your account has been successfully created under the email: ${email}.\n\nDately is your personal virtual assistant that tracks your expiring identity cards, certificates, insurance policies, and checklist payment deadlines (like rent or utility bills) with automated email and SMS notifications.\n\nTo get started, log in to your dashboard, upload your first document, and set up your settings.\n\nBest regards,\nThe Dately Team`;
      
      const welcomeUser = {
        name,
        email: email.toLowerCase(),
        phone,
        notificationPreferences: { email: true, sms: false } // Trigger welcome via email only
      };
      
      await dispatchNotification(welcomeUser, subject, welcomeMessage);
    } catch (emailErr) {
      console.error('Welcome email dispatch failed, but registration succeeded:', emailErr.message);
    }

    res.status(201).json({
      _id: userId,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      onboarded: newUser.onboarded,
      notificationPreferences: newUser.notificationPreferences,
      googleConnected: newUser.googleConnected,
      googleDriveSimulatedQuotaUsed: newUser.googleDriveSimulatedQuotaUsed,
      googleDriveSimulatedQuotaTotal: newUser.googleDriveSimulatedQuotaTotal,
      googleDriveForceQuotaExceeded: newUser.googleDriveForceQuotaExceeded,
      token: generateToken(userId),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Generate and send OTP via WhatsApp
// @route   POST /api/auth/send-otp
// @access  Public
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    let cleanNumber = phone.replace('+', '').replace(/\s/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }

    await db.collection('otps').doc(cleanNumber).set({
      otp,
      expiresAt
    });

    try {
      const { dispatchNotification } = await import('../services/notificationService.js');
      const subject = 'Verification Code';
      const otpMessage = `Your verification code is: *${otp}*`;
      
      const otpUser = {
        phone,
        notificationPreferences: { email: false, sms: true }
      };
      
      await dispatchNotification(otpUser, subject, otpMessage);
      console.log(`[OTP SENT SUCCESS] To: ${phone} | Code: ${otp}`);
    } catch (err) {
      console.error('Failed to send OTP via Twilio WhatsApp:', err.message);
      console.log('\n================================================================');
      console.log(`[WHATSAPP OTP SIMULATION] To: ${phone} | OTP: ${otp}`);
      console.log('================================================================\n');
    }

    res.json({
      message: 'OTP verification code sent successfully.',
      otp,
      phone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Verify OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ message: 'Phone number and OTP code are required' });
  }

  try {
    let cleanNumber = phone.replace('+', '').replace(/\s/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }

    const otpDoc = await db.collection('otps').doc(cleanNumber).get();

    if (!otpDoc.exists) {
      return res.status(400).json({ message: 'Invalid verification code or code has expired' });
    }

    const storedOtp = otpDoc.data();

    if (new Date() > new Date(storedOtp.expiresAt)) {
      await db.collection('otps').doc(cleanNumber).delete();
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    if (storedOtp.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect verification code' });
    }

    await db.collection('otps').doc(cleanNumber).delete();

    res.json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userSnapshot = await db.collection('users').where('email', '==', email.toLowerCase()).get();

    if (userSnapshot.empty) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.json({
        _id: userDoc.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        onboarded: user.onboarded,
        notificationPreferences: user.notificationPreferences,
        googleConnected: user.googleConnected,
        googleDriveSimulatedQuotaUsed: user.googleDriveSimulatedQuotaUsed,
        googleDriveSimulatedQuotaTotal: user.googleDriveSimulatedQuotaTotal,
        googleDriveForceQuotaExceeded: user.googleDriveForceQuotaExceeded,
        token: generateToken(userDoc.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user._id).get();

    if (userDoc.exists) {
      const user = userDoc.data();
      let driveQuota = null;

      if (user.googleConnected && user.googleTokens) {
        try {
          // Wrap it with _id for drive service functions
          const compatUser = { ...user, _id: userDoc.id };
          const quota = await checkDriveStorage(compatUser, 0);
          driveQuota = {
            used: quota.usage,
            total: quota.limit
          };
        } catch (err) {
          console.error('Failed to retrieve real Google Drive storage space:', err.message);
        }
      }

      res.json({
        _id: userDoc.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        onboarded: user.onboarded,
        notificationPreferences: user.notificationPreferences,
        googleConnected: user.googleConnected,
        googleDriveSimulatedQuotaUsed: driveQuota ? driveQuota.used : user.googleDriveSimulatedQuotaUsed,
        googleDriveSimulatedQuotaTotal: driveQuota ? driveQuota.total : user.googleDriveSimulatedQuotaTotal,
        googleDriveForceQuotaExceeded: user.googleDriveForceQuotaExceeded,
      });
    } else {
      res.status(404).json({ message: 'User profile not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get real Google Drive storage quota directly
// @route   GET /api/auth/drive-storage
// @access  Private
router.get('/drive-storage', protect, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user._id).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = { ...userDoc.data(), _id: userDoc.id };

    if (!user.googleConnected || !user.googleTokens) {
      return res.json({
        connected: false,
        limit: 16106127360,
        usage: 0,
        remaining: 16106127360,
        usageInDrive: 0,
        usageInDriveTrash: 0
      });
    }

    const quota = await checkDriveStorage(user, 0);
    res.json({
      connected: true,
      limit: quota.limit,
      usage: quota.usage,
      remaining: quota.remaining,
      usageInDrive: quota.usageInDrive || 0,
      usageInDriveTrash: quota.usageInDriveTrash || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const userDocRef = db.collection('users').doc(req.user._id);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      const user = userDoc.data();
      const updates = {};

      updates.name = req.body.name || user.name;
      updates.phone = req.body.phone || user.phone;

      if (req.body.onboarded !== undefined) {
        updates.onboarded = req.body.onboarded;
      }

      if (req.body.notificationPreferences) {
        updates.notificationPreferences = {
          ...(user.notificationPreferences || {}),
          ...req.body.notificationPreferences,
        };
      }

      // Google Drive Sync Fields
      if (req.body.googleConnected !== undefined) {
        updates.googleConnected = req.body.googleConnected;
        if (!req.body.googleConnected) {
          updates.googleDriveSimulatedQuotaUsed = 13421772800; // 12.5 GB
          updates.googleDriveForceQuotaExceeded = false;
        }
      }

      if (req.body.googleDriveForceQuotaExceeded !== undefined) {
        updates.googleDriveForceQuotaExceeded = req.body.googleDriveForceQuotaExceeded;
      }

      if (req.body.googleDriveSimulatedQuotaUsed !== undefined) {
        updates.googleDriveSimulatedQuotaUsed = req.body.googleDriveSimulatedQuotaUsed;
      }

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(req.body.password, salt);
      }

      await userDocRef.update(updates);
      const updatedUser = (await userDocRef.get()).data();

      res.json({
        _id: userDoc.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        onboarded: updatedUser.onboarded,
        notificationPreferences: updatedUser.notificationPreferences,
        googleConnected: updatedUser.googleConnected,
        googleDriveSimulatedQuotaUsed: updatedUser.googleDriveSimulatedQuotaUsed,
        googleDriveSimulatedQuotaTotal: updatedUser.googleDriveSimulatedQuotaTotal,
        googleDriveForceQuotaExceeded: updatedUser.googleDriveForceQuotaExceeded,
        token: generateToken(userDoc.id),
      });
    } else {
      res.status(404).json({ message: 'User profile not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Redirect to Google OAuth consent screen
// @desc    Redirect to Google OAuth consent screen for Log In / Sign Up
// @route   GET /api/auth/google-login
// @access  Public
router.get('/google-login', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    return res.status(400).send('Google Client ID/Secret missing in .env');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent select_account',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/drive.file'
    ],
    state: 'google-login'
  });

  res.redirect(authUrl);
});

// @desc    Redirect to Google OAuth consent screen for Linking Drive
// @route   GET /api/auth/google
// @access  Private (Needs token as query parameter)
router.get('/google', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).send('Authentication token is required to link Google Drive');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    return res.status(400).send(`
      <html>
        <head>
          <title>Google Drive API Configuration</title>
          <style>
            body { font-family: -apple-system, sans-serif; padding: 40px; color: #1e293b; background: #f8fafc; }
            .card { background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            h1 { color: #0f172a; margin-top: 0; }
            code { background: #f1f5f9; padding: 3px 6px; border-radius: 4px; font-family: monospace; font-size: 14px; }
            pre { background: #0f172a; color: #f8fafc; padding: 15px; border-radius: 8px; overflow-x: auto; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Google Drive Configuration Required</h1>
            <p>To connect a real Google account, please add your Google credentials to your backend <code>server/.env</code> file:</p>
            <pre>GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback</pre>
            <p><strong>Note:</strong> You can create OAuth Credentials at the <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a> with the <code>.../auth/drive.file</code> scope enabled.</p>
            <p>After saving the environment variables, restart the MERN servers and try connecting again!</p>
          </div>
        </body>
      </html>
    `);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Offline access requests a refresh token so we can upload files indefinitely
    prompt: 'consent select_account',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    state: token // Pass user JWT to verify identity inside callback!
  });

  res.redirect(authUrl);
});

// @desc    Google OAuth Callback
// @route   GET /api/auth/google/callback
// @access  Public
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query; // state contains our JWT token OR 'google-login'!

  if (!code || !state) {
    return res.redirect('http://localhost:3000/settings?google=error');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (state === 'google-login') {
      // 1. Google Single Sign-On (SSO) Log In / Sign Up Flow
      const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
      const userInfo = await oauth2.userinfo.get();
      const googleEmail = userInfo.data.email.toLowerCase();
      const googleName = userInfo.data.name;

      const userSnapshot = await db.collection('users').where('email', '==', googleEmail).get();
      let userDocRef;
      let userId;
      let isNewUser = false;

      if (userSnapshot.empty) {
        // Register new Google SSO user
        isNewUser = true;
        const salt = await bcrypt.genSalt(10);
        const randomPassword = Math.random().toString(36) + Math.random().toString(36);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        const newUser = {
          name: googleName,
          email: googleEmail,
          phone: 'N/A',
          password: hashedPassword,
          onboarded: false,
          notificationPreferences: {
            email: true,
            sms: false,
            push: true,
            voiceCalls: false,
            voiceCallsCriticalOnly: true
          },
          googleConnected: true,
          googleDriveSimulatedQuotaUsed: 13421772800,
          googleDriveSimulatedQuotaTotal: 16106127360,
          googleDriveForceQuotaExceeded: false,
          googleTokens: tokens,
          googleDriveFolderId: '',
          createdAt: new Date().toISOString()
        };

        userDocRef = await db.collection('users').add(newUser);
        userId = userDocRef.id;
      } else {
        // Log in existing user
        const userDoc = userSnapshot.docs[0];
        userDocRef = userDoc.ref;
        userId = userDoc.id;

        await userDocRef.update({
          googleConnected: true,
          googleTokens: tokens
        });
      }

      // Initialize Drive Folder for Google Sign-In user
      try {
        const user = (await userDocRef.get()).data();
        const compatUser = { ...user, _id: userId };
        const { getOrCreateDriveFolder } = await import('../services/driveService.js');
        const folderId = await getOrCreateDriveFolder(compatUser, oauth2Client);
        await userDocRef.update({ googleDriveFolderId: folderId });
      } catch (driveErr) {
        console.error('Failed to create folder on Google Sign In:', driveErr.message);
      }

      const clientOrigin = req.headers.origin || process.env.FRONTEND_URL || 'https://dately-ten.vercel.app';
      const jwtToken = generateToken(userId);
      const redirectBase = isNewUser ? `${clientOrigin}/onboarding` : `${clientOrigin}/dashboard`;
      return res.redirect(`${redirectBase}?token=${jwtToken}`);
    }

    // 2. Google Drive Storage Link Flow (User was already logged in)
    const decoded = jwt.verify(state, JWT_SECRET);
    const userDocRef = db.collection('users').doc(decoded.id);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).send('User not found');
    }

    const user = userDoc.data();
    const compatUser = { ...user, _id: userDoc.id };

    // Create or link the dedicated folder immediately
    const { getOrCreateDriveFolder } = await import('../services/driveService.js');
    const folderId = await getOrCreateDriveFolder(compatUser, oauth2Client);

    // Save tokens, folderId and connect Google Drive
    await userDocRef.update({
      googleTokens: tokens,
      googleDriveFolderId: folderId,
      googleConnected: true
    });

    const clientOrigin = req.headers.origin || process.env.FRONTEND_URL || 'https://dately-ten.vercel.app';
    res.redirect(`${clientOrigin}/settings?google=connected`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    const clientOrigin = req.headers.origin || process.env.FRONTEND_URL || 'https://dately-ten.vercel.app';
    if (state === 'google-login') {
      res.redirect(`${clientOrigin}/login?google=error`);
    } else {
      res.redirect(`${clientOrigin}/settings?google=error`);
    }
  }
});

export default router;
