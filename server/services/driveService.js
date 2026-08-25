import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { db } from '../config/firebase.js';

/**
 * Returns OAuth2 client if Google credentials are set up in .env
 */
const getOAuthClient = (user) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  
  // Set credentials from user object (tokens would be stored under user in a production system)
  if (user.googleTokens) {
    oauth2Client.setCredentials(user.googleTokens);
  }
  
  return oauth2Client;
};

/**
 * Checks if the Google Drive has enough space for the uploaded file.
 * Throws an error if out of storage space.
 */
export const checkDriveStorage = async (user, fileSizeBytes) => {
  // If the sandbox "Simulate Full Space" switch is toggled
  if (user.googleDriveForceQuotaExceeded) {
    throw new Error('Your Google Drive storage is full. Please clear some space (15.0 GB limit exceeded) and try again.');
  }

  const oauth2Client = getOAuthClient(user);
  
  if (oauth2Client) {
    // REAL MODE: Query actual Google Drive storage quota
    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const response = await drive.about.get({
        fields: 'storageQuota, user',
      });
      const quota = response.data.storageQuota;
      
      const limit = parseInt(quota.limit, 10) || 16106127360;
      const usage = parseInt(quota.usage, 10) || 0;
      const remaining = Math.max(0, limit - usage);
      const usageInDrive = parseInt(quota.usageInDrive, 10) || 0;
      const usageInDriveTrash = parseInt(quota.usageInDriveTrash, 10) || 0;

      if (remaining < fileSizeBytes) {
        throw new Error(`Your Google Drive storage is full. Only ${Math.round(remaining / (1024 * 1024))} MB remaining.`);
      }
      return { limit, usage, remaining, usageInDrive, usageInDriveTrash };
    } catch (err) {
      console.error('Real Google Drive Quota check failed:', err.message);
    }
  }

  // DEFAULT / VAULT ACTIVE CALCULATION
  const limit = user.googleDriveSimulatedQuotaTotal || 16106127360; // 15 GB
  const usage = user.googleDriveSimulatedQuotaUsed || 0;
  const remaining = Math.max(0, limit - usage);

  if (remaining < fileSizeBytes) {
    throw new Error('Your Google Drive storage is full. Please clear some space and try again.');
  }

  return { limit, usage, remaining, usageInDrive: usage, usageInDriveTrash: 0 };
};

/**
 * Helper to ensure a dedicated folder named "Dately Vault" exists on the user's Google Drive.
 * Returns the folder ID and updates the user record if created.
 */
export const getOrCreateDriveFolder = async (user, oauth2Client) => {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // 1. If folder ID is already stored, verify that it still exists in Google Drive
  if (user.googleDriveFolderId) {
    try {
      const response = await drive.files.get({
        fileId: user.googleDriveFolderId,
        fields: 'id, trashed',
      });
      if (response.data && !response.data.trashed) {
        return user.googleDriveFolderId;
      }
    } catch (err) {
      console.log('Stored Dately Vault folder not found or deleted, re-creating...');
    }
  }

  // 2. Search for any existing folder named "Dately Vault" (not trashed) to avoid duplicates
  try {
    const searchResponse = await drive.files.list({
      q: "name = 'Dately Vault' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id)',
      spaces: 'drive',
    });
    
    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      const folderId = searchResponse.data.files[0].id;
      user.googleDriveFolderId = folderId;
      if (user._id) {
        await db.collection('users').doc(user._id).update({ googleDriveFolderId: folderId });
      }
      return folderId;
    }
  } catch (err) {
    console.error('Error searching for existing Dately Vault folder:', err.message);
  }

  // 3. Create a new folder named "Dately Vault"
  try {
    const fileMetadata = {
      name: 'Dately Vault',
      mimeType: 'application/vnd.google-apps.folder',
    };

    const folderResponse = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    const folderId = folderResponse.data.id;
    user.googleDriveFolderId = folderId;
    if (user._id) {
      await db.collection('users').doc(user._id).update({ googleDriveFolderId: folderId });
    }
    return folderId;
  } catch (err) {
    console.error('Failed to create Dately Vault folder on Google Drive:', err.message);
    throw new Error('Failed to create "Dately Vault" folder on Google Drive: ' + err.message);
  }
};

/**
 * Uploads a file to Google Drive.
 * Returns the Drive file ID and public link.
 */
export const uploadToDrive = async (user, filePath, fileName, mimeType) => {
  const oauth2Client = getOAuthClient(user);
  const fileStats = fs.statSync(filePath);
  const fileSizeBytes = fileStats.size;

  // 1. Verify storage capacity first
  await checkDriveStorage(user, fileSizeBytes);

  if (oauth2Client) {
    // REAL MODE: Upload to actual Google Drive
    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      // Get or create the dedicated app folder ID
      const folderId = await getOrCreateDriveFolder(user, oauth2Client);

      const fileMetadata = {
        name: fileName,
        parents: [folderId], // Uploads into the specific Dately Vault folder!
      };
      
      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath),
      };
      
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      return {
        driveFileId: response.data.id,
        driveLink: response.data.webViewLink,
        mode: 'real',
      };
    } catch (err) {
      console.error('Real Google Drive Upload failed, falling back to simulation:', err.message);
    }
  }

  // SIMULATION MODE: Simulate syncing to drive folder
  console.log(`--- SIMULATING GOOGLE DRIVE UPLOAD FOR: ${user.email} ---`);
  console.log(`File Name: ${fileName}`);
  console.log(`File Size: ${Math.round(fileSizeBytes / 1024)} KB`);
  console.log(`Mime Type: ${mimeType}`);
  
  // Deduct storage from simulated quota
  user.googleDriveSimulatedQuotaUsed = (user.googleDriveSimulatedQuotaUsed || 13421772800) + fileSizeBytes;
  if (user._id) {
    await db.collection('users').doc(user._id).update({
      googleDriveSimulatedQuotaUsed: user.googleDriveSimulatedQuotaUsed
    });
  }

  const simulatedFileId = `gdrive-sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const simulatedLink = `https://drive.google.com/open?id=${simulatedFileId}`;

  console.log(`Google Drive Sync Success! File ID: ${simulatedFileId}`);
  console.log(`-----------------------------------------------------`);

  return {
    driveFileId: simulatedFileId,
    driveLink: simulatedLink,
    mode: 'simulated',
  };
};

/**
 * Deletes a file from Google Drive.
 */
export const deleteFromDrive = async (user, driveFileId) => {
  if (!driveFileId) return false;

  const oauth2Client = getOAuthClient(user);

  if (oauth2Client) {
    // REAL MODE: Call Google Drive Delete API
    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      await drive.files.delete({
        fileId: driveFileId,
      });
      console.log(`Successfully deleted file from Google Drive: ${driveFileId}`);
      return true;
    } catch (err) {
      console.error(`Failed to delete file ${driveFileId} from Google Drive:`, err.message);
      return false;
    }
  }

  // SIMULATION MODE: Log delete call and mock refunding quota space
  console.log(`--- SIMULATING GOOGLE DRIVE DELETE FOR: ${user.email} ---`);
  console.log(`File ID to Delete: ${driveFileId}`);
  
  // Refund 5MB (average) to simulated quota to clear space
  const refundBytes = 5 * 1024 * 1024;
  user.googleDriveSimulatedQuotaUsed = Math.max(0, (user.googleDriveSimulatedQuotaUsed || 13421772800) - refundBytes);
  if (user._id) {
    await db.collection('users').doc(user._id).update({
      googleDriveSimulatedQuotaUsed: user.googleDriveSimulatedQuotaUsed
    });
  }
  
  console.log(`Google Drive File Deleted. Quota refunded.`);
  console.log(`-----------------------------------------------------`);
  return true;
};
