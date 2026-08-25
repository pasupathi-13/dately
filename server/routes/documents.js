import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { db } from '../config/firebase.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadToDrive, deleteFromDrive } from '../services/driveService.js';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Multer File Filter & Upload Initializer
const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    const filetypes = /pdf|jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  },
});

// Helper: Extract Expiry Date using Regex and keyword lookups
function extractExpiryDate(text) {
  const lowercaseText = text.toLowerCase();
  const foundDates = [];
  
  // 1. Scan for alphabetic month dates (e.g. 26 Aug 2026, August 26, 2026, 26-August-2026)
  const monthNamesRegex = /\b(\d{1,2})?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*,?\s*(\d{4})\b/gi;
  let match;
  while ((match = monthNamesRegex.exec(text)) !== null) {
    const day = match[1] ? match[1].padStart(2, '0') : '01';
    const monthMap = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const month = monthMap[match[2].toLowerCase().substring(0, 3)];
    const year = match[3];
    const formatted = `${year}-${month}-${day}`;
    foundDates.push({
      dateStr: formatted,
      index: match.index,
      isFuture: new Date(formatted) > new Date()
    });
  }
  
  // 2. Scan for numeric dates allowing optional spaces (e.g. 26/08/2026, 26 - 08 - 2026, 26 - Aug - 26)
  const numericRegex = /\b(\d{1,4})\s*[-/]\s*(\d{1,4})\s*[-/]\s*(\d{1,4})\b/g;
  while ((match = numericRegex.exec(text)) !== null) {
    let year = '';
    let month = '';
    let day = '';
    
    const p1 = match[1].trim();
    const p2 = match[2].trim();
    const p3 = match[3].trim();
    
    if (p1.length === 4) {
      // YYYY-MM-DD
      year = p1;
      month = p2;
      day = p3;
    } else if (p3.length === 4) {
      // DD-MM-YYYY or MM-DD-YYYY
      year = p3;
      month = p2;
      day = p1;
    } else {
      // Short years like 28 (assume 2028)
      year = `20${p3}`;
      month = p2;
      day = p1;
    }
    
    // Normalize day and month swaps
    let dayNum = parseInt(day, 10);
    let monthNum = parseInt(month, 10);
    
    if (monthNum > 12 && dayNum <= 12) {
      const temp = month;
      month = day;
      day = temp;
    }
    
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');
    
    const formatted = `${year}-${month}-${day}`;
    foundDates.push({
      dateStr: formatted,
      index: match.index,
      isFuture: new Date(formatted) > new Date()
    });
  }

  // Filter only valid dates
  const validDates = foundDates.filter(d => !isNaN(new Date(d.dateStr).getTime()));
  
  if (validDates.length === 0) {
    return '';
  }

  // Filter for future dates
  const futureDates = validDates.filter(d => d.isFuture);
  
  // If there are future dates, use them. Otherwise, fall back to matching keyword proximity on all valid dates!
  const candidateDates = futureDates.length > 0 ? futureDates : validDates;

  // Find the date closest to expiry keyword occurrences
  const keywords = ['expiry', 'expire', 'valid', 'till', 'valid up to', 'valid until', 'validity', 'due date', 'ends on', 'end date', 'val. till', 'val', 'upto'];
  let bestDate = candidateDates[0].dateStr;
  let minDistance = Infinity;
  
  for (const keyword of keywords) {
    let kwIdx = -1;
    while ((kwIdx = lowercaseText.indexOf(keyword, kwIdx + 1)) !== -1) {
      for (const fd of candidateDates) {
        const distance = Math.abs(fd.index - kwIdx);
        if (distance < minDistance) {
          minDistance = distance;
          bestDate = fd.dateStr;
        }
      }
    }
  }
  
  return bestDate;
}

// Helper: Run metadata analyzer on text
function analyzeDocumentText(text, filename) {
  const lowercaseText = text.toLowerCase();
  let category = 'Other';
  let provider = '';
  let policyNumber = '';
  
  // Clean filename to use as the base document name
  let name = filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_]/g, " ")
    .replace(/[-]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
  
  // Deduce Category
  if (lowercaseText.includes('insurance') || lowercaseText.includes('policy') || lowercaseText.includes('premium')) {
    category = 'Insurance';
  } else if (lowercaseText.includes('licence') || lowercaseText.includes('license') || lowercaseText.includes('driving')) {
    category = 'Identity';
  } else if (lowercaseText.includes('passport') || lowercaseText.includes('visa')) {
    category = 'Identity';
  } else if (lowercaseText.includes('registration certificate') || lowercaseText.includes('vehicle rc') || lowercaseText.includes('chassis') || lowercaseText.includes('rto') || lowercaseText.includes('pollution') || lowercaseText.includes('puc') || lowercaseText.includes('under control')) {
    category = 'Vehicle';
  } else if (lowercaseText.includes('degree') || lowercaseText.includes('university') || lowercaseText.includes('diploma') || lowercaseText.includes('semester')) {
    category = 'Education';
  } else if (lowercaseText.includes('bill') || lowercaseText.includes('electricity') || lowercaseText.includes('invoice')) {
    category = 'Bill';
  }

  // Intercept generic screenshot/image names and replace with descriptive title based on content
  if (lowercaseText.includes('pollution under control certificate') || lowercaseText.includes('puc certificate')) {
    category = 'Vehicle';
    provider = 'Delhi Pollution Control Committee';
    if (name.startsWith('Chatgpt Image') || name.startsWith('Screenshot') || name.startsWith('File')) {
      name = 'Pollution Under Control Certificate';
    }
  }
  
  // Deduce Provider (if not already set)
  if (!provider) {
    if (category === 'Insurance') {
      const insurers = ['Star Health', 'HDFC Ergo', 'ICICI Lombard', 'LIC', 'New India Assurance', 'Tata AIG', 'Bajaj Allianz', 'ABC Insurance'];
      for (const ins of insurers) {
        if (text.includes(ins)) {
          provider = ins;
          break;
        }
      }
    } else if (category === 'Identity') {
      if (lowercaseText.includes('licence') || lowercaseText.includes('license')) {
        provider = 'Regional Transport Office (RTO)';
      } else if (lowercaseText.includes('passport')) {
        provider = 'Ministry of External Affairs';
      }
    } else if (category === 'Education') {
      const uniMatch = text.match(/([A-Z][a-zA-Z\s]+University)/);
      if (uniMatch) {
        provider = uniMatch[1];
      }
    }
  }

  // Extract policy/doc numbers
  const numberKeywords = ['policy no', 'policy number', 'licence no', 'licence number', 'license no', 'license number', 'passport no', 'passport number', 'dl no', 'document no', 'registration no', 'puc code', 'certificate sl. no'];
  for (const kw of numberKeywords) {
    const idx = lowercaseText.indexOf(kw);
    if (idx !== -1) {
      const snippet = text.substring(idx, Math.min(idx + 50, text.length));
      // Support matching masked letters like stars DL3C***9685
      const numMatch = snippet.match(/\b([A-Z0-9-/*]{6,20})\b/i);
      if (numMatch) {
        policyNumber = numMatch[1].toUpperCase();
        break;
      }
    }
  }

  const expiryDate = extractExpiryDate(text);

  return { name, category, provider, policyNumber, expiryDate };
}

// @desc    Analyze uploaded document and auto-extract properties
// @route   POST /api/documents/analyze
// @access  Private
router.post('/analyze', protect, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No document file uploaded' });
  }

  try {
    const filename = req.file.originalname;
    const sizeInMB = req.file.size / (1024 * 1024);
    const fileSizeStr = sizeInMB >= 0.1 ? `${sizeInMB.toFixed(1)} MB` : `${Math.round(req.file.size / 1024)} KB`;

    // 1. Gemini Multimodal AI Analysis (if API Key is configured)
    if (process.env.GEMINI_API_KEY) {
      console.log('--- RUNNING GEMINI MULTIMODAL AI ANALYSIS ---');
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const fileBuffer = fs.readFileSync(req.file.path);
        const filePart = {
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType: req.file.mimetype
          }
        };

        const prompt = `You are an intelligent document parsing assistant. 
Analyze the uploaded document image or PDF.
Extract the following details as a clean JSON object. 
Only output the JSON object, nothing else. Do not wrap it in markdown codeblocks.

JSON Schema:
{
  "name": "Cleaned name of the document (e.g. 'Driving Licence' or 'Vehicle Registration Certificate')",
  "category": "One of: 'Insurance', 'Identity', 'Vehicle', 'Education', 'Bill', 'Other'",
  "provider": "The issuing authority or provider name (e.g. 'Regional Transport Office' or 'Star Health Insurance')",
  "policyNumber": "The policy number, licence number, document number, or registration number",
  "expiryDate": "The expiry, validity end date, or due date, formatted as YYYY-MM-DD. If none is found, return empty string."
}`;

        const result = await model.generateContent([prompt, filePart]);
        const responseText = result.response.text();
        console.log('--- GEMINI AI RESPONSE:', responseText);

        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const metadata = JSON.parse(cleanedText);

        return res.json({
          name: metadata.name || filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " "),
          category: metadata.category || 'Other',
          provider: metadata.provider || '',
          policyNumber: metadata.policyNumber || '',
          expiryDate: metadata.expiryDate || '',
          fileSize: fileSizeStr,
          tempFilePath: `/uploads/${req.file.filename}`,
        });
      } catch (geminiError) {
        console.error('Gemini API Error, falling back to local OCR:', geminiError.message);
      }
    }

    // 2. Local Fallback OCR & Parsing (Tesseract + PDF-parse)
    let extractedText = '';
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const parsedData = await pdf(dataBuffer);
      extractedText = parsedData.text || '';
      console.log('--- EXTRACTED PDF TEXT START ---');
      console.log(extractedText);
      console.log('--- EXTRACTED PDF TEXT END ---');
    } else {
      console.log('--- RUNNING TESSERACT OCR ON IMAGE:', req.file.path);
      const worker = await createWorker('eng');
      const ret = await worker.recognize(req.file.path);
      extractedText = ret.data.text || '';
      await worker.terminate();
      console.log('--- TESSERACT OCR TEXT START ---');
      console.log(extractedText);
      console.log('--- TESSERACT OCR TEXT END ---');

      // Append cleaned filename for category/name hints
      const cleanedFilename = filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ");
      extractedText = `${cleanedFilename}\n${extractedText}`;
    }

    const metadata = analyzeDocumentText(extractedText, filename);

    res.json({
      ...metadata,
      fileSize: fileSizeStr,
      tempFilePath: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    console.error('OCR Error:', error.message);
    res.status(500).json({ message: 'Failed to analyze document', error: error.message });
  }
});

// @desc    Get all user documents
// @route   GET /api/documents
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('documents').where('user', '==', req.user._id).get();
    const documents = [];
    snapshot.forEach(doc => {
      documents.push({
        _id: doc.id,
        ...doc.data()
      });
    });
    // Sort by createdAt descending
    documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new document with optional file upload
// @route   POST /api/documents
// @access  Private
router.post('/', protect, upload.single('file'), async (req, res) => {
  const { name, provider, policyNumber, vehicleNumber, issueDate, expiryDate, status, category, filePath, fileSize } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Document name is required' });
  }

  try {
    let fileInfoSize = fileSize || '1.0 MB';
    let fileInfoPath = filePath || '';
    let driveFileId = '';
    let driveLink = '';

    // Determine the local file path to upload
    let localFilePath = '';
    let originalName = name;
    let mimeType = 'application/octet-stream'; // fallback

    if (req.file) {
      localFilePath = req.file.path;
      originalName = req.file.originalname;
      mimeType = req.file.mimetype;
    } else if (filePath) {
      const filename = path.basename(filePath);
      localFilePath = path.join('uploads', filename);
      originalName = name + path.extname(filename);
      // Determine mimetype from extension
      const ext = path.extname(filename).toLowerCase();
      if (ext === '.pdf') mimeType = 'application/pdf';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    }

    // If Google Drive is connected for this user, upload the file
    if (localFilePath && fs.existsSync(localFilePath) && req.user.googleConnected) {
      try {
        const driveResult = await uploadToDrive(
          req.user,
          localFilePath,
          originalName,
          mimeType
        );
        driveFileId = driveResult.driveFileId;
        driveLink = driveResult.driveLink;
      } catch (driveError) {
        console.error('Google Drive Sync Error:', driveError.message);
        return res.status(400).json({ message: driveError.message });
      }
    }

    if (req.file) {
      const sizeInMB = req.file.size / (1024 * 1024);
      fileInfoSize = sizeInMB >= 0.1 ? `${sizeInMB.toFixed(1)} MB` : `${Math.round(req.file.size / 1024)} KB`;
      fileInfoPath = `/uploads/${req.file.filename}`;
    }

    const newDocument = {
      user: req.user._id,
      name,
      provider: provider || '',
      policyNumber: policyNumber || '',
      vehicleNumber: vehicleNumber || '',
      issueDate: issueDate || '',
      expiryDate: expiryDate || '',
      status: status || 'Active',
      category: category || 'Other',
      fileSize: fileInfoSize,
      filePath: fileInfoPath,
      driveFileId,
      driveLink,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('documents').add(newDocument);

    res.status(201).json({
      _id: docRef.id,
      ...newDocument
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a document
// @route   PUT /api/documents/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const docRef = db.collection('documents').doc(req.params.id);
    const docSnapshot = await docRef.get();

    if (docSnapshot.exists) {
      const docData = docSnapshot.data();
      if (docData.user !== req.user._id) {
        return res.status(401).json({ message: 'User not authorized to update this document' });
      }

      const updates = {};
      updates.name = req.body.name || docData.name;
      updates.provider = req.body.provider !== undefined ? req.body.provider : docData.provider;
      updates.policyNumber = req.body.policyNumber !== undefined ? req.body.policyNumber : docData.policyNumber;
      updates.vehicleNumber = req.body.vehicleNumber !== undefined ? req.body.vehicleNumber : docData.vehicleNumber;
      updates.issueDate = req.body.issueDate !== undefined ? req.body.issueDate : docData.issueDate;
      updates.expiryDate = req.body.expiryDate || docData.expiryDate;
      updates.status = req.body.status || docData.status;
      updates.category = req.body.category || docData.category;

      await docRef.update(updates);

      res.json({
        _id: docRef.id,
        ...docData,
        ...updates
      });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const docRef = db.collection('documents').doc(req.params.id);
    const docSnapshot = await docRef.get();

    if (docSnapshot.exists) {
      const docData = docSnapshot.data();
      if (docData.user !== req.user._id) {
        return res.status(401).json({ message: 'User not authorized to delete this document' });
      }

      // Optionally delete physical file
      if (docData.filePath) {
        const fullPath = path.join(process.cwd(), docData.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      // Delete from Google Drive if synced
      if (docData.driveFileId && req.user.googleConnected) {
        await deleteFromDrive(req.user, docData.driveFileId);
      }

      await docRef.delete();
      res.json({ message: 'Document removed successfully' });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
