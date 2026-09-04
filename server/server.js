import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import obligationRoutes from './routes/obligations.js';
import notificationRoutes from './routes/notifications.js';
import reminderRoutes from './routes/reminders.js';
import { scanAndSendReminders } from './services/notificationService.js';
import { db } from './config/firebase.js'; // Trigger Firebase initialization check

// Load environment variables
dotenv.config();

// Global crash protection handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
});

// Ensure uploads folder exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/obligations', obligationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reminders', reminderRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Dately API server is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  
  // Start background notification & task time scanner (runs every 60 seconds for minute-level precision)
  const SCAN_INTERVAL = 60 * 1000;
  setInterval(async () => {
    try {
      await scanAndSendReminders();
    } catch (err) {
      console.error('Scheduled reminder scan failed:', err.message);
    }
  }, SCAN_INTERVAL);

  // Run an initial scan 5 seconds after server boot
  setTimeout(async () => {
    console.log('Running initial boot reminder scan...');
    try {
      await scanAndSendReminders();
    } catch (err) {
      console.error('Initial reminder scan failed:', err.message);
    }
  }, 5000);
});
