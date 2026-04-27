const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    check_in_date: { type: Date, required: true },
    check_in_time: { type: String, required: true },
    method: { type: String, enum: ['manual', 'qr'], default: 'manual' },
  },
  { timestamps: false }
);

attendanceSchema.index({ member_id: 1, check_in_date: 1 }, { unique: true });

attendanceSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Attendance', attendanceSchema);
