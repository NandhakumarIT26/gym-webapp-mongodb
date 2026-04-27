const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    sent_via: { type: String, enum: ['SMS', 'WhatsApp'], required: true },
    message: { type: String, default: null },
    sent_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

reminderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Reminder', reminderSchema);
