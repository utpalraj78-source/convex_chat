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
      const Group = (await import('../models/Group.js')).default;
      const group = await Group.findById(groupId);
      if (!group || !group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not a group member' });
      }
      const msgs = await Message.find({ to: `group:${groupId}` }).sort({ createdAt: 1 }).lean();
      return res.json(msgs.map(msg => ({
        ...msg,
        from: msg.from?.toString(),
        to: msg.to?.toString()
      })));
    }
    // For private chat, fetch all messages where user is sender or recipient (robust to ObjectId/string storage)
    if (!userId || !peerId) {
      safeErrorLog('messages', 'Missing required IDs', { userId, peerId });
      return res.status(400).json({ error: 'Missing required IDs' });
    }
    const mongoose = (await import('mongoose')).default;
    // Prepare all forms: string and ObjectId for both user and peer
    let userObjId = undefined, peerObjId = undefined;
    if (/^[a-fA-F0-9]{24}$/.test(userId)) {
      try { userObjId = new mongoose.Types.ObjectId(userId); } catch {}
    }
    if (/^[a-fA-F0-9]{24}$/.test(peerId)) {
      try { peerObjId = new mongoose.Types.ObjectId(peerId); } catch {}
    }
    const fromVals = [userId];
    const toVals = [peerId];
    if (userObjId) fromVals.push(userObjId);
    if (peerObjId) toVals.push(peerObjId);
    const peerFromVals = [peerId];
    const peerToVals = [userId];
    if (peerObjId) peerFromVals.push(peerObjId);
    if (userObjId) peerToVals.push(userObjId);
    const orConditions = [
      { from: { $in: fromVals }, to: { $in: toVals } },
      { from: { $in: peerFromVals }, to: { $in: peerToVals } }
    ];
    const msgs = await Message.find({ $or: orConditions }).sort({ createdAt: 1 }).lean();
    return res.json(msgs.map(msg => ({
      ...msg,
      from: msg.from?.toString(),
      to: msg.to?.toString()
    })));
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
    if (!req.file) {
      safeErrorLog('Messages', 'No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { from, to } = req.body;
    
    // Validate required fields
    if (!from || !to) {
      safeErrorLog('Messages', 'Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create file message in DB
    const msg = await Message.create({
      from,
      to,
      type: 'file',
      fileUrl: `/files/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      isEncrypted: true,
      isPrivate: false,
      createdAt: Date.now()
    });

    // ...existing code...

    // Return standardized message format
    res.json({
      _id: msg._id,
      from: msg.from,
      to: msg.to,
      type: 'file',
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      createdAt: msg.createdAt
    });
  } catch (err) {
    console.error('[messages] Error saving file message:', err);
    res.status(500).json({ error: 'Failed to save file message' });
  }
});

// Voice message upload route
router.post('/voice', uploadVoice.single('voice'), async (req, res) => {
  try {
    if (!req.file) {
      safeErrorLog('Messages', 'No voice file uploaded');
      return res.status(400).json({ error: 'No voice file uploaded' });
    }

    const { from, to } = req.body;
    
    // Validate required fields
    if (!from || !to) {
      safeErrorLog('Messages', 'Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create voice message in DB
    const msg = await Message.create({
      from,
      to,
      type: 'voice',
      fileUrl: `/voicemails/${req.file.filename}`,
      fileName: req.file.originalname || 'voicemail.webm',
      fileSize: req.file.size,
      isEncrypted: true,
      isPrivate: false,
      createdAt: Date.now()
    });

    // ...existing code...

    // Return standardized message format
    res.json({
      _id: msg._id,
      from: msg.from,
      to: msg.to,
      type: 'voice',
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      createdAt: msg.createdAt
    });
  } catch (err) {
    console.error('[messages] Error saving voice message:', err);
    res.status(500).json({ error: 'Failed to save voice message' });
  }
});

// Save text message
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { to, text, type } = req.body;

  if (!text || !to) {
    console.error('[messages] Missing required fields:', { text, to });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const mongoose = (await import('mongoose')).default;
    let toId;
    if (typeof to === 'string' && to.startsWith('group:')) {
      // Group chat: store as string
      toId = to;
    } else {
      // Private chat: always store as ObjectId
      toId = new mongoose.Types.ObjectId(to);
    }
    const fromId = new mongoose.Types.ObjectId(userId);
    const msg = await Message.create({
      from: fromId,
      to: toId,
      text,
      type: type || 'text',
      createdAt: new Date()
    });
    res.json({
      _id: msg._id.toString(),
      from: msg.from.toString(),
      to: (typeof msg.to === 'object' && msg.to.toString) ? msg.to.toString() : msg.to,
      text: msg.text,
      type: msg.type,
      createdAt: msg.createdAt
    });
  } catch (err) {
    console.error('Error saving text message:', err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

export default router;
