import express from 'express';
import { db } from '../config/firebase.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all user obligations
// @route   GET /api/obligations
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('obligations').where('user', '==', req.user._id).get();
    const obligations = [];
    
    snapshot.forEach(doc => {
      obligations.push({
        _id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by dueDate ascending
    obligations.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    res.json(obligations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new obligation
// @route   POST /api/obligations
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, category, amount, dueDate, priority, repeat, reminderPreference, notificationChannels } = req.body;

  if (!name || amount === undefined || !dueDate) {
    return res.status(400).json({ message: 'Obligation name, amount, and due date are required' });
  }

  try {
    const newObligation = {
      user: req.user._id,
      name,
      category: category || 'Other',
      amount,
      dueDate,
      priority: priority || 'Medium',
      repeat: repeat || 'One-time',
      reminderPreference: reminderPreference || '1 day before',
      notificationChannels: notificationChannels || ['In-App'],
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('obligations').add(newObligation);
    
    res.status(201).json({
      _id: docRef.id,
      ...newObligation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update an obligation
// @route   PUT /api/obligations/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const docRef = db.collection('obligations').doc(req.params.id);
    const docSnapshot = await docRef.get();

    if (docSnapshot.exists) {
      const docData = docSnapshot.data();
      
      if (docData.user !== req.user._id) {
        return res.status(401).json({ message: 'User not authorized to update this obligation' });
      }

      const updates = {};
      updates.name = req.body.name || docData.name;
      updates.category = req.body.category || docData.category;
      updates.amount = req.body.amount !== undefined ? req.body.amount : docData.amount;
      updates.priority = req.body.priority || docData.priority;
      updates.repeat = req.body.repeat || docData.repeat;
      updates.reminderPreference = req.body.reminderPreference || docData.reminderPreference;
      updates.notificationChannels = req.body.notificationChannels || docData.notificationChannels;

      const currentRepeat = updates.repeat || docData.repeat;
      const currentDueDateStr = req.body.dueDate || docData.dueDate;

      // Handle rollover if marked Completed and is a recurring obligation
      if (req.body.status === 'Completed' && currentRepeat !== 'One-time' && currentRepeat !== 'Does not repeat') {
        const currentDueDate = new Date(currentDueDateStr);
        if (!isNaN(currentDueDate.getTime())) {
          if (currentRepeat === 'Monthly') {
            currentDueDate.setMonth(currentDueDate.getMonth() + 1);
          } else if (currentRepeat === 'Weekly') {
            currentDueDate.setDate(currentDueDate.getDate() + 7);
          } else if (currentRepeat === 'Daily') {
            currentDueDate.setDate(currentDueDate.getDate() + 1);
          } else if (currentRepeat === 'Yearly') {
            currentDueDate.setFullYear(currentDueDate.getFullYear() + 1);
          }
          updates.dueDate = currentDueDate.toISOString().split('T')[0];
          updates.status = 'Pending'; // Reset to pending for the next cycle
        } else {
          updates.status = req.body.status;
        }
      } else {
        updates.dueDate = req.body.dueDate || docData.dueDate;
        updates.status = req.body.status || docData.status;
      }

      await docRef.update(updates);
      
      res.json({
        _id: docRef.id,
        ...docData,
        ...updates
      });
    } else {
      res.status(404).json({ message: 'Obligation not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete an obligation
// @route   DELETE /api/obligations/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const docRef = db.collection('obligations').doc(req.params.id);
    const docSnapshot = await docRef.get();

    if (docSnapshot.exists) {
      const docData = docSnapshot.data();
      
      if (docData.user !== req.user._id) {
        return res.status(401).json({ message: 'User not authorized to delete this obligation' });
      }

      await docRef.delete();
      res.json({ message: 'Obligation removed successfully' });
    } else {
      res.status(404).json({ message: 'Obligation not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
