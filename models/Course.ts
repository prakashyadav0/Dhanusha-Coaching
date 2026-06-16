import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
  teacher: mongoose.Types.ObjectId;
  isPublished: boolean;
  totalVideos: number;
  totalNotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    totalVideos: {
      type: Number,
      default: 0,
    },
    totalNotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;