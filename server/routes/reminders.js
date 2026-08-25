import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { db } from '../config/firebase.js';

const router = express.Router();

// @desc    Get all reminders for logged-in user
// @route   GET /api/reminders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const remindersSnapshot = await db.collection('reminders')
      .where('userId', '==', req.user._id)
      .get();

    const reminders = [];
    remindersSnapshot.forEach((doc) => {
      reminders.push({
        _id: doc.id,
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by date and time
    reminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new reminder
// @route   POST /api/reminders
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, category, dueDate, time, notes } = req.body;

    if (!name || !dueDate) {
      return res.status(400).json({ message: 'Name and Due Date are required.' });
    }

    const newReminder = {
      userId: req.user._id,
      name,
      category: category || 'Personal',
      dueDate,
      time: time || '',
      notes: notes || '',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('reminders').add(newReminder);
    
    res.status(201).json({
      _id: docRef.id,
      id: docRef.id,
      ...newReminder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Toggle reminder status (Pending / Completed)
// @route   PUT /api/reminders/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const reminderRef = db.collection('reminders').doc(req.params.id);
    const doc = await reminderRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Reminder not found.' });
    }

    const reminder = doc.data();

    // Authorization check
    if (reminder.userId !== req.user._id) {
      return res.status(401).json({ message: 'Not authorized.' });
    }

    const nextStatus = reminder.status === 'Completed' ? 'Pending' : 'Completed';
    await reminderRef.update({ status: nextStatus });

    res.json({
      _id: doc.id,
      id: doc.id,
      ...reminder,
      status: nextStatus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const reminderRef = db.collection('reminders').doc(req.params.id);
    const doc = await reminderRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Reminder not found.' });
    }

    const reminder = doc.data();

    // Authorization check
    if (reminder.userId !== req.user._id) {
      return res.status(401).json({ message: 'Not authorized.' });
    }

    await reminderRef.delete();

    res.json({ message: 'Reminder deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
