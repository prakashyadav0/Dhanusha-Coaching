import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  pidx?: string;
  transactionId?: string;
  esewaRefId?: string;
  paymentMethod: 'khalti' | 'esewa' | 'free' | 'bank' | 'manual';
  approvedBy?: mongoose.Types.ObjectId;  // admin who approved a bank payment
  approvedAt?: Date;
  grantedBy?: mongoose.Types.ObjectId;   // admin who manually enrolled the user
  grantNote?: string;                    // e.g. "scholarship", "offline cash", "staff"
  refundedBy?: mongoose.Types.ObjectId;  // admin who refunded/revoked this order
  refundedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user:   { type: Schema.Types.ObjectId, ref: 'User',   required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    pidx:          { type: String, default: '' },
    transactionId: { type: String, default: '' },
    esewaRefId:    { type: String, default: '' },
    paymentMethod: {
      type: String,
      enum: ['khalti', 'esewa', 'free', 'bank', 'manual'],
      default: 'khalti',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    grantedBy:  { type: Schema.Types.ObjectId, ref: 'User', default: null },
    grantNote:  { type: String, default: '' },
    refundedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    refundedAt: { type: Date, default: null },
    paidAt:     { type: Date, default: null },
  },
  { timestamps: true }
);

// One active paid enrollment per user per course
OrderSchema.index({ user: 1, course: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;