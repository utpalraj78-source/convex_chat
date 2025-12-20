import multer from 'multer';
import path from 'path';
import fs from 'fs';
import express from 'express';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateOtp } from "../utils/otp.js";
import nodemailer from "nodemailer";

const router = express.Router();

// Profile picture upload setup
const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.id || Date.now()}${ext}`);
  }
});
const uploadAvatar = multer({ storage: avatarStorage });
// ===== UPLOAD PROFILE PICTURE =====
router.post('/upload-avatar', uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const { id } = req.body;
    if (!req.file || !id) return res.status(400).json({ error: 'Missing file or user id' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    res.setHeader('Content-Type', 'application/json');
    res.json({ message: 'Avatar uploaded', avatar: user.avatar });
  } catch (err) {
    console.error('Avatar Upload Error:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ===== REQUEST PASSWORD RESET OTP =====
router.post('/request-password-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No user found with this email address' });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    try {
      await sendOtpEmail(user.email, otp);
      res.json({ message: 'OTP sent to your registered email' });
    } catch (mailErr) {
      console.error('Failed to send OTP email:', mailErr);
      return res.status(500).json({ error: 'Failed to send OTP email. Please check server email configuration.' });
    }
  } catch (err) {
    console.error('Request Password OTP Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== CHANGE PASSWORD WITH OTP =====
router.post('/change-password-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (Date.now() > user.otpExpiry) return res.status(400).json({ error: 'OTP expired' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Change Password OTP Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== UPDATE PROFILE (username/email) =====
router.post('/update-profile', async (req, res) => {
  try {
    const { id, username, email } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (username) user.username = username;
    if (email) user.email = email;
    await user.save();
    res.json({ message: 'Profile updated', user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
console.log("🚀 auth.js loaded");






// ===== Helper: Send OTP Email =====
async function sendOtpEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    html: `<p>Your OTP code is: <b>${otp}</b></p>`,
  });
}

// ===== REGISTER =====
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, email } = req.body;

    if (!username || !password || !email)
      return res.status(400).json({ error: 'Username, password, and email are required.' });

    if (role && !['admin', 'user'].includes(role))
      return res.status(400).json({ error: 'Invalid role.' });

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(409).json({ error: 'Username already taken.' });

    const hash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    const user = await User.create({
      username,
      password: hash,
      role: role || 'user',
      email,
      verified: false,
      otp,
      otpExpiry
    });

    await sendOtpEmail(email, otp);

    res.status(201).json({
      message: "User registered. OTP sent to email.",
      username: user.username
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});


// ===== VERIFY OTP =====
router.post('/verify-otp', async (req, res) => {
  try {
    const { username, otp } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.verified) return res.status(400).json({ error: "User already verified" });

    if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
    if (Date.now() > user.otpExpiry) return res.status(400).json({ error: "OTP expired" });

    user.verified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (err) {
    console.error("OTP Verification Error:", err);
    res.status(500).json({ error: "Internal server error during OTP verification." });
  }
});
// ===== UPDATE EMAIL =====
router.post("/update-email", async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ error: "User not found" });

    user.email = email;
    user.verified = false;

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendOtpEmail(email, otp);

    res.json({
      message: "OTP sent to email",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        verified: user.verified,
      },
    });
  } catch (err) {
    console.error("Update Email Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// ===== LOGIN =====
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    if (!user.verified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal server error during login." });
  }
});

// ===== GET ALL USERS =====
router.get("/users", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const users = await User.find({ _id: { $ne: payload.id } });

    const filteredUsers = users.map((u) => ({
      id: u._id,
      username: u.username,
      avatar: u.avatar || null,
    }));

    res.json(filteredUsers);
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(401).json({ error: "Invalid or expired token." });
  }
});

export default router;
