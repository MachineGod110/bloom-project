import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

const checkinSchema = new mongoose.Schema(
  {
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    checkins: { type: [checkinSchema], default: [] },
    aiNotes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    personalizedBaseline: { type: mongoose.Schema.Types.Mixed, default: null },
    latestExamReport: { type: mongoose.Schema.Types.Mixed, default: null },
    sessionHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
    nextReminder: { type: Date, default: null },
    reminderIntervalDays: { type: Number, default: 30 },
  },
  { timestamps: true }
);

// Never store or return plaintext passwords.
userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    checkinCount: Array.isArray(this.checkins) ? this.checkins.length : 0,
    nextReminder: this.nextReminder,
  };
};

export default mongoose.model("User", userSchema);
