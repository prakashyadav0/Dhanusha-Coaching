import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVideo extends Document {
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeId: string;
  course: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  order: number;
  duration?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    youtubeUrl: {
      type: String,
      required: [true, "YouTube URL is required"],
      trim: true,
    },
    youtubeId: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Posted by is required"],
    },
    order: {
      type: Number,
      default: 0,
    },
    duration: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Extract YouTube ID before saving
VideoSchema.pre("save", function () {
  if (!this.isModified("youtubeUrl")) return;

  const match = this.youtubeUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&\n?#]+)/
  );

  this.youtubeId = match ? match[1] : "";
});

const Video: Model<IVideo> =
  mongoose.models.Video ||
  mongoose.model<IVideo>("Video", VideoSchema);

export default Video;