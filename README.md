# CONVEX 🌌

> **Secure, Seamless, and Stunning Communication Reimagined.**

Convex is a next-generation real-time messaging application built with the **MERN Stack** (MongoDB, Express, React, Node.js). It combines robust security with a cinematic, highly interactive "Space-Themed" user interface to provide a premium communication experience. From crystal-clear video calls to instant file sharing, Convex is designed for the modern web.

---

## ✨ Features

### 🚀 **Immersive User Experience**
- **Cinematic Space UI**: A fully dynamic background featuring a depth-aware starfield and rotating asteroids built with HTML5 Canvas.
- **Dynamic Cursor**: A custom physics-based cursor with a "comet" particle trail that reacts to movement.
- **Fluid Animations**: Every interaction—from message bubbles to navigation—is animated using **Framer Motion** for a smooth, tactile feel.
- **Theme Awareness**: Seamless Dark/Light mode switching that adapts the entire cosmic environment.

### 💬 **Real-Time Communication**
- **Instant Messaging**: Powered by **Socket.io** for sub-millisecond latency.
- **Voice Messages**: Record and send voice notes instantly with a built-in player.
- **File Sharing**: Securely upload and share images and documents.
- **Smart Notifications**: Real-time in-app notifications with badge counts and one-click navigation.

### 📞 **Video & Audio Calls**
- **HD Video Calling**: Peer-to-peer video calls using **WebRTC** for direct, low-latency connection.
- **Audio Calls**: Crystal clear voice calls integrated directly into the chat interface.
- **Incoming Call Alerts**: Global overlay alerts for incoming calls, accessible from anywhere in the app.

### 🔐 **Security & Accounts**
- **Secure Authentication**: JWT-based session management with HttpOnly cookies.
- **Account Verification**: Email OTP verification for registration and password resets.
- **Privacy First**: End-to-end design philosophy keeping user data secure.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [React.js](https://react.dev/) (Vite)
- **UI Library**: [Material UI (MUI)](https://mui.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: React Hooks & Context API
- **Real-time Client**: `socket.io-client`
- **Styling**: Emotion & Custom CSS Variables

### **Backend**
- **Runtime**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Real-time Engine**: [Socket.io](https://socket.io/)
- **File Storage**: Multer (Local storage)
- **Security**: `bcrypt` (Hashing), `jsonwebtoken`, `cors`

---

## ⚙️ Installation & Setup

Follow these steps to get a local copy up and running.

### **Prerequisites**
- **Node.js**: v14.0.0 or higher
- **MongoDB**: Local installed instance or MongoDB Atlas URI



### **1. Backend Setup**
Navigate to the backend folder and install dependencies:
```bash
cd backend
npm install
```

**Create a `.env` file in the `backend` directory:**
```env
PORT=5000
MONGO_URI=<YOUR_MONGODB_URI>
JWT_SECRET=<YOUR_JWT_SECRET>
CLIENT_URL=http://localhost:5173
EMAIL_USER=<YOUR_EMAIL>
EMAIL_PASS=<YOUR_APP_PASSWORD>
```

**Start the Backend Server:**
```bash
npm start
# OR for development
npm run dev
```

### **3. Frontend Setup**
Open a new terminal, navigate to the frontend folder:
```bash
cd frontend
npm install
```

**Create a `.env` file in the `frontend` directory:**
```env
VITE_API_URL=http://localhost:5000
```

**Start the Frontend:**
```bash
npm run dev
```

The app should now be running at `http://localhost:5173`.

---

## 📂 Project Structure

```
convex/
├── backend/
│   ├── models/         # Mongoose Schemas (User, Message)
│   ├── routes/         # Express API Routes (auth, messages)
│   ├── uploads/        # Local storage for files/avatars
│   ├── index.js        # Server entry point
│   ├── socket.js       # Socket.io & WebRTC signaling logic
│   └── ...
└── frontend/
    ├── src/
    │   ├── components/ # Reusable UI components (SpaceBackground, CustomCursor)
    │   ├── context/    # Global state (CallContext, AuthContext)
    │   ├── Chatbox.jsx # Main chat interface logic
    │   ├── App.jsx     # Main layout and routing
    │   ├── main.css    # Global styles & animations
    │   └── ...
    └── index.html
```

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Utpal Raj**

- Project Link: [Convex Project](https://github.com/utpalraj78-source)
