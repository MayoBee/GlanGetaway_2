import mongoose, { Document, Schema } from "mongoose";

export interface IResortOwnerApplication extends Document {
  userId: mongoose.Types.ObjectId;
  dtiPermit: string;
  municipalEngineeringCert: string;
  municipalHealthCert: string;
  menroCert: string;
  bfpPermit: string;
  businessPermit: string;
  nationalId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
}

const resortOwnerApplicationSchema = new Schema<IResortOwnerApplication>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dtiPermit: {
    type: String,
    required: true,
  },
  municipalEngineeringCert: {
    type: String,
    required: true,
  },
  municipalHealthCert: {
    type: String,
    required: true,
  },
  menroCert: {
    type: String,
    required: true,
  },
  bfpPermit: {
    type: String,
    required: true,
  },
  businessPermit: {
    type: String,
    required: true,
  },
  nationalId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: {
    type: Date,
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectionReason: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IResortOwnerApplication>('ResortOwnerApplication', resortOwnerApplicationSchema);
