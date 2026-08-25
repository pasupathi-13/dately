import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
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
    provider: {
      type: String,
      default: '',
    },
    policyNumber: {
      type: String,
      default: '',
    },
    vehicleNumber: {
      type: String,
      default: '',
    },
    issueDate: {
      type: String,
      default: '',
    },
    expiryDate: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Active',
    },
    category: {
      type: String,
      default: 'Other',
    },
    fileSize: {
      type: String,
      default: '0 KB',
    },
    filePath: {
      type: String,
      default: '',
    },
    driveFileId: {
      type: String,
      default: '',
    },
    driveLink: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model('Document', documentSchema);
export default Document;
