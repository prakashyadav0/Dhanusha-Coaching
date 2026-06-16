import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotice extends Document {
  title: string;
  body: string;
  postedBy: mongoose.Types.ObjectId;
  targetRole: 'all' | 'user' | 'teacher';
  course?: mongoose.Types.ObjectId | null; // null = platform-wide notice
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Notice body is required'],
      trim: true,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Posted by is required'],
    },
    targetRole: {
      type: String,
      enum: ['all', 'user', 'teacher'],
      default: 'all',
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null, // if null → shown to all users of the platform
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notice: Model<INotice> =
  mongoose.models.Notice || mongoose.model<INotice>('Notice', NoticeSchema);

export default Notice;