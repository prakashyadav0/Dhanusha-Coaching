import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  pidx?: string;
  transactionId?: string;
  esewaRefId?: string;
  paymentMethod: 'khalti' | 'esewa' | 'free' | 'bank';
  approvedBy?: mongoose.Types.ObjectId;  // admin who approved
  approvedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    pidx:        { type: String, default: '' },
    transactionId: { type: String, default: '' },
    esewaRefId:  { type: String, default: '' },
    paymentMethod: {
      type: String,
      enum: ['khalti', 'esewa', 'free', 'bank'],
      default: 'khalti',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    paidAt:     { type: Date, default: null },
  },
  { timestamps: true }
);

OrderSchema.index({ user: 1, course: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;