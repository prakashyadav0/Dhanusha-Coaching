import mongoose, { Schema, Document, Model } from 'mongoose';

export type LinkType = 'live_class' | 'exam';

export interface ILink extends Document {
  title: string;
  url: string;
  type: LinkType;
  description?: string;
  course?: mongoose.Types.ObjectId | null;  // optional: scope to a specific course
  isActive: boolean;
  postedBy: mongoose.Types.ObjectId;
  startsAt?: Date | null;                   // optional scheduled start time
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema = new Schema<ILink>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['live_class', 'exam'],
      required: [true, 'Type is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startsAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Link: Model<ILink> =
  mongoose.models.Link || mongoose.model<ILink>('Link', LinkSchema);

export default Link;