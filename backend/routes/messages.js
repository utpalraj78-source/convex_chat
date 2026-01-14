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

import { uploadToSupabase } from '../utils/supabaseStorage.js';

// Use memory storage for production-ready uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[messages] File upload request from user: ${userId}`);

    if (!req.file) {
      console.warn('[messages] No file in upload');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { to } = req.body;
    if (!to) {
      console.warn('[messages] Missing "to" field in file upload');
      return res.status(400).json({ error: 'Missing recipient (to)' });
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const fileUrl = await uploadToSupabase(
      req.file.buffer,
      'messages',
      `files/${fileName}`,
      req.file.mimetype
    );

    const payload = {
      from: userId,
      to,
      type: 'file',
      fileUrl,
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
      error: 'Failed to upload file to storage',
      details: err.message
    });
  }
});

// Voice message upload route
router.post('/voice', upload.single('voice'), async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[messages] Voice upload request from user: ${userId}`);

    if (!req.file) {
      console.warn('[messages] No file in voice upload');
      return res.status(400).json({ error: 'No voice file uploaded' });
    }

    const { to } = req.body;
    console.log('[messages] Voice upload details:', {
      to,
      fileName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    if (!to) {
      console.warn('[messages] Missing "to" field in voice upload');
      return res.status(400).json({ error: 'Missing recipient (to)' });
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-voicemail.webm`;
    const fileUrl = await uploadToSupabase(
      req.file.buffer,
      'messages',
      `voicemails/${fileName}`,
      'audio/webm'
    );

    const payload = {
      from: userId,
      to,
      type: 'voice',
      fileUrl,
      fileName: 'voicemail.webm',
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
    console.error('[messages] CRITICAL ERROR in /voice:', err);
    res.status(500).json({
      error: 'Failed to process voice message',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
