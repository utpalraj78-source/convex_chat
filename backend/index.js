/**
 * CONVEX v1.0 - Project Complete
 * Secure, Seamless, and Stunning Communication Reimagined.
 * Core features fully implemented.
 */
import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Set up ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL
].filter(Boolean);

// Load environment variables
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

import attachWS from './socket.js';
import authRouter from './routes/auth.js';
import messageRouter from './routes/messages.js';
import User from './models/User.js';
import bcrypt from 'bcrypt';

const app = express();


// Create HTTP server
const server = http.createServer(app);

// Basic middleware
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Set up static file serving
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads/avatars', express.static(path.join(uploadsDir, 'avatars')));
app.use('/files', express.static(path.join(uploadsDir, 'files')));
app.use('/voicemails', express.static(path.join(uploadsDir, 'voicemails')));

// Create upload directories
const voicemailsDir = path.join(uploadsDir, 'voicemails');
const filesDir = path.join(uploadsDir, 'files');
[voicemailsDir, filesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

// Routes
app.get('/ping', (req, res) => res.json({ status: 'ok', time: new Date() }));
app.use('/auth', authRouter);
app.use('/messages', messageRouter);



// Connect to MongoDB and start server
// Connect to Database (Supabase) and start server
const startServer = async () => {
  try {
    console.log("✅ Supabase Client Initialized");

    // Create admin user if doesn't exist
    const adminUser = await User.findOne({ username: 'heyitsadmin' });
    if (!adminUser) {
      const hash = await bcrypt.hash('24dcs042', 10);
      try {
        await User.create({
          username: 'heyitsadmin',
          password: hash,
          role: 'admin',
          email: 'admin@chat.com',
          verified: true
        });
        console.log("👑 Admin user created");
      } catch (err) {
        console.warn("⚠️ Could not create admin user (might already exist or schema error):", err.message);
      }
    }
  } catch (error) {
    console.warn("⚠️ Error checking admin user:", error.message);
  }

  // Start server
  try {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`
      🚀 CONVEX SERVER RUNNING
      📡 Port: ${PORT}
      🌍 Mode: ${process.env.NODE_ENV || 'development'}
      `);
    });

    // Attach WebSocket
    attachWS(server);
  } catch (err) {
    console.error("❌ Failed to start HTTP server:", err);
  }
};

// Start the server
startServer();
