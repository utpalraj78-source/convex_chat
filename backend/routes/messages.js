import express from 'express';
import Message from '../models/Message.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { safeLog, safeErrorLog } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadBaseDir = path.join(__dirname, '..', 'uploads');
const filesDir = path.join(uploadBaseDir, 'files');
const voicemailsDir = path.join(uploadBaseDir, 'voicemails');

// Create directories if they don't exist
[filesDir, voicemailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Storage engine for files
const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, filesDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});

// Storage engine for voicemails
const voiceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, voicemailsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webm';
    cb(null, uniqueName);
  }
});

// File filter (optional)
const fileFilter = (req, file, cb) => {
  cb(null, true); // Accept all files
};

const uploadFile = multer({ storage: fileStorage, fileFilter });
const uploadVoice = multer({ storage: voiceStorage });


const router = express.Router();

// Middleware to authenticate token
router.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});


//  Get messages between current user and specific peer or group
router.get('/:peerId', async (req, res) => {
  try {
    const userId = req.user.id;
    const peerId = req.params.peerId;

    // If group chat, fetch by group logic
    if (peerId.startsWith('group:')) {
      const groupId = peerId.replace('group:', '');
      // Note: Group model also needs refactoring if used here
      // const Group = (await import('../models/Group.js')).default;
      // const group = await Group.findById(groupId);
      // if (!group || !group.members.includes(userId)) {
      //   return res.status(403).json({ error: 'Not a group member' });
      // }

      const msgs = await Message.getGroupHistory(groupId);
      return res.json(msgs);
    }

    // For private chat
    if (!userId || !peerId) {
      safeErrorLog('messages', 'Missing required IDs', { userId, peerId });
      return res.status(400).json({ error: 'Missing required IDs' });
    }

    const msgs = await Message.getPrivateHistory(userId, peerId);
    return res.json(msgs);
  } catch (error) {
    console.error('[messages] Error fetching messages:', error);
    return res.status(500).json({
      error: 'Failed to fetch messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// File upload route for chat
router.post('/upload', uploadFile.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[messages] File upload request from user: ${userId}`);

    if (!req.file) {
      console.warn('[messages] No file in upload');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { to } = req.body;
    console.log(`[messages] File: ${req.file.originalname}, size: ${req.file.size}, to: ${to}`);

    if (!to) {
      console.warn('[messages] Missing "to" field in file upload');
      return res.status(400).json({ error: 'Missing recipient (to)' });
    }

    const payload = {
      from: userId,
      to,
      type: 'file',
      fileUrl: `/files/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      isEncrypted: true,
      isPrivate: false,
      created_at: new Date()
    };

    console.log('[messages] Saving file message to DB...');
    const msg = await Message.create(payload);
    console.log('[messages] File message saved successfully:', msg._id);

    res.json(msg);
  } catch (err) {
    console.error('[messages] Error in /upload:', err);
    res.status(500).json({
      error: 'Failed to save file message',
      details: err.message
    });
  }
});

// Voice message upload route
router.post('/voice', uploadVoice.single('voice'), async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[messages] Voice upload request from user: ${userId}`);

    if (!req.file) {
      console.warn('[messages] No file in voice upload');
      return res.status(400).json({ error: 'No voice file uploaded' });
    }

    const { to } = req.body;
    console.log(`[messages] Voice file: ${req.file.filename}, size: ${req.file.size}, to: ${to}`);

    if (!to) {
      console.warn('[messages] Missing "to" field in voice upload');
      return res.status(400).json({ error: 'Missing recipient (to)' });
    }

    const payload = {
      from: userId,
      to,
      type: 'voice',
      fileUrl: `/voicemails/${req.file.filename}`,
      fileName: req.file.originalname || 'voicemail.webm',
      fileSize: req.file.size,
      isEncrypted: true,
      isPrivate: false,
      created_at: new Date()
    };

    console.log('[messages] Saving voice message to DB...');
    const msg = await Message.create(payload);
    console.log('[messages] Voice message saved successfully:', msg._id);

    res.json(msg);
  } catch (err) {
    console.error('[messages] Error in /voice:', err);
    res.status(500).json({
      error: 'Failed to save voice message',
      details: err.message
    });
  }
});

// Save text message
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { to, text, type } = req.body;

  if (!text || !to) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const msg = await Message.create({
      from: userId,
      to: to,
      text,
      type: type || 'text',
      created_at: new Date()
    });
    res.json(msg);
  } catch (err) {
    console.error('Error saving text message:', err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

export default router;
