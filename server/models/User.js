import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    onboarded: {
      type: Boolean,
      default: false,
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      voiceCalls: { type: Boolean, default: false },
      voiceCallsCriticalOnly: { type: Boolean, default: true },
    },
    googleConnected: {
      type: Boolean,
      default: false,
    },
    googleDriveSimulatedQuotaUsed: {
      type: Number,
      default: 13421772800, // 12.5 GB in bytes
    },
    googleDriveSimulatedQuotaTotal: {
      type: Number,
      default: 16106127360, // 15 GB in bytes
    },
    googleDriveForceQuotaExceeded: {
      type: Boolean,
      default: false,
    },
    googleTokens: {
      type: Object,
      default: null,
    },
    googleDriveFolderId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hook to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
