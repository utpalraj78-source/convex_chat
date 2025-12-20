import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true, required: false },
  isEmailVerified: { type: Boolean, default: false },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
    required: true
  },
  verified: { type: Boolean, default: false },
  avatar: { type: String, default: '' },
  otp: String,
  otpExpiry: Number
});

export default mongoose.model('User', userSchema);
