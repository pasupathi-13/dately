import mongoose from 'mongoose';

const obligationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'Other',
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    dueDate: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      default: 'Medium',
    },
    repeat: {
      type: String,
      default: 'One-time',
    },
    reminderPreference: {
      type: String,
      default: '1 day before',
    },
    notificationChannels: {
      type: [String],
      default: ['In-App'],
    },
    status: {
      type: String,
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

const Obligation = mongoose.model('Obligation', obligationSchema);
export default Obligation;
