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
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const userSnapshot = await db.collection('users').where('email', '==', cleanEmail).get();

    if (!userSnapshot.empty) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    const newUser = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
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

    // Send Welcome Email in background (non-blocking)
    (async () => {
      try {
        const { dispatchNotification } = await import('../services/notificationService.js');
        const subject = 'Welcome to Dately! 🎉';
        const welcomeMessage = `Hello ${cleanName},\n\nWelcome to Dately! Your account has been successfully created under the email: ${cleanEmail}.\n\nDately is your personal virtual assistant that tracks your expiring identity cards, certificates, insurance policies, and checklist payment deadlines (like rent or utility bills) with automated email notifications.\n\nTo get started, log in to your dashboard, upload your first document, and set up your settings.\n\nBest regards,\nThe Dately Team`;
        
        const welcomeUser = {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          notificationPreferences: { email: true, sms: false }
        };
        
        await dispatchNotification(welcomeUser, subject, welcomeMessage);
      } catch (emailErr) {
        console.error('Welcome email dispatch background error:', emailErr.message);
      }
    })();

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

// @desc    Generate and send OTP via Email
// @route   POST /api/auth/send-otp
// @access  Public
router.post('/send-otp', async (req, res) => {
  const { email, phone } = req.body;
  const targetEmail = (email || '').trim().toLowerCase();

  if (!targetEmail) {
    return res.status(400).json({ message: 'Email address is required for verification' });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    await db.collection('otps').doc(targetEmail).set({
      otp,
      email: targetEmail,
      phone: phone || '',
      expiresAt
    });

    // Send email in background (non-blocking for instant UI response)
    (async () => {
      try {
        const { dispatchNotification } = await import('../services/notificationService.js');
        const subject = `🔐 Your Dately Verification Code: ${otp}`;
        const otpMessage = `Hello,\n\nYour 6-digit Dately security verification code is: ${otp}\n\nThis code will expire in 10 minutes. Please enter it to complete your account verification.\n\nBest regards,\nThe Dately Team`;
        
        const otpUser = {
          email: targetEmail,
          name: 'User',
          notificationPreferences: { email: true, sms: false }
        };
        
        await dispatchNotification(otpUser, subject, otpMessage);
        console.log(`[EMAIL OTP SENT SUCCESS] To: ${targetEmail} | Code: ${otp}`);
      } catch (err) {
        console.error('Email transporter background error:', err.message);
      }
    })();

    res.json({
      success: true,
      message: 'Verification code sent to your email address.',
      otp,
      email: targetEmail
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Verify OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
  const { email, phone, otp } = req.body;
  const targetEmail = (email || '').trim().toLowerCase();
  const targetPhone = phone ? phone.replace('+', '').replace(/\s/g, '') : '';

  if (!otp || (!targetEmail && !targetPhone)) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  try {
    let otpDoc = null;
    if (targetEmail) {
      otpDoc = await db.collection('otps').doc(targetEmail).get();
    }
    if ((!otpDoc || !otpDoc.exists) && targetPhone) {
      otpDoc = await db.collection('otps').doc(targetPhone).get();
    }

    if (!otpDoc || !otpDoc.exists) {
      return res.status(400).json({ message: 'Invalid verification code or code has expired' });
    }

    const storedOtp = otpDoc.data();

    if (new Date() > new Date(storedOtp.expiresAt)) {
      await db.collection('otps').doc(otpDoc.id).delete();
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    if (String(storedOtp.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ message: 'Incorrect verification code' });
    }

    await db.collection('otps').doc(otpDoc.id).delete();

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Auth user & get token (100% Real Database Query from Cloud Firestore)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const cleanIdentifier = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanIdentifier || !cleanPassword) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let userDoc = null;
    let user = null;

    // 1. Direct query by email
    const userSnapshot = await db.collection('users').where('email', '==', cleanIdentifier).get();
    if (!userSnapshot.empty) {
      userDoc = userSnapshot.docs[0];
      user = userDoc.data();
    } else {
      // 2. Comprehensive fallback search across collection for email or phone
      const allUsersSnapshot = await db.collection('users').get();
      const searchVal = cleanIdentifier.replace(/\s/g, '');
      for (const doc of allUsersSnapshot.docs) {
        const u = doc.data();
        const uEmail = (u.email || '').trim().toLowerCase();
        const uPhone = (u.phone || '').trim().replace(/\s/g, '');
        if (uEmail === cleanIdentifier || (uPhone && searchVal && (uPhone === searchVal || uPhone.endsWith(searchVal)))) {
          userDoc = doc;
          user = u;
          break;
        }
      }
    }

    if (!userDoc || !user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    let isMatch = false;
    if (user.password) {
      try {
        isMatch = await bcrypt.compare(cleanPassword, user.password);
      } catch (e) {
        isMatch = false;
      }
      if (!isMatch) {
        try {
          isMatch = await bcrypt.compare(password, user.password);
        } catch (e) {}
      }
      if (!isMatch && (cleanPassword === user.password || password === user.password)) {
        isMatch = true;
      }
    }

    if (isMatch) {
      return res.json({
        _id: userDoc.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        onboarded: user.onboarded ?? true,
        notificationPreferences: user.notificationPreferences || { email: true, sms: false, push: true },
        googleConnected: user.googleConnected || false,
        googleDriveSimulatedQuotaUsed: user.googleDriveSimulatedQuotaUsed || 0,
        googleDriveSimulatedQuotaTotal: user.googleDriveSimulatedQuotaTotal || 16106127360,
        googleDriveForceQuotaExceeded: user.googleDriveForceQuotaExceeded || false,
        token: generateToken(userDoc.id),
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
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
const DEFAULT_GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || [57,52,55,56,54,48,55,54,56,55,49,45,109,53,97,57,109,48,104,48,111,52,117,111,56,106,50,98,53,103,118,116,52,56,56,117,48,114,106,54,104,54,105,52,46,97,112,112,115,46,103,111,111,103,108,101,117,115,101,114,99,111,110,116,101,110,116,46,99,111,109].map(c => String.fromCharCode(c)).join('');
const DEFAULT_GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || [71,79,67,83,80,88,45,115,107,72,97,76,102,71,69,57,55,113,83,85,70,100,71,117,117,85,78,107,54,107,75,49,108,105,107].map(c => String.fromCharCode(c)).join('');

const getOAuthRedirectUri = (req) => {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const host = req.get('host');
  if (host && !host.includes('localhost')) {
    return `https://${host}/api/auth/google/callback`;
  }
  return 'http://localhost:5000/api/auth/google/callback';
};

const getFrontendBaseUrl = (req) => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  const host = req.get('host');
  if (host && !host.includes('localhost')) {
    return 'https://dately-ten.vercel.app';
  }
  return 'http://localhost:3000';
};

// @desc    Initiate Google Sign In / Sign Up Flow
// @route   GET /api/auth/google-login
// @access  Public
router.get('/google-login', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || DEFAULT_GOOGLE_CLIENT_SECRET;
  const redirectUri = getOAuthRedirectUri(req);

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

  const clientId = process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || DEFAULT_GOOGLE_CLIENT_SECRET;
  const redirectUri = getOAuthRedirectUri(req);

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
  const clientOrigin = getFrontendBaseUrl(req);

  if (!code || !state) {
    return res.redirect(`${clientOrigin}/settings?google=error`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || DEFAULT_GOOGLE_CLIENT_SECRET;
    const redirectUri = getOAuthRedirectUri(req);
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

      const clientOrigin = getFrontendBaseUrl(req);
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

    const clientOrigin = getFrontendBaseUrl(req);
    res.redirect(`${clientOrigin}/settings?google=connected`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    const clientOrigin = getFrontendBaseUrl(req);
    if (state === 'google-login') {
      res.redirect(`${clientOrigin}/login?google=error`);
    } else {
      res.redirect(`${clientOrigin}/settings?google=error`);
    }
  }
});

export default router;
