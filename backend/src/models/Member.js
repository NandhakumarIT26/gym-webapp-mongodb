const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true },
    address: { type: String, default: null },
    plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', default: null },
    join_date: { type: Date, required: true },
    expiry_date: { type: Date, default: null },
    status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
    qr_token: { type: String, unique: true, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

memberSchema.index({ name: 'text', phone: 'text' });

memberSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Member', memberSchema);
