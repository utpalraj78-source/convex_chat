import { Modal } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { useAuth, useTheme } from "./main";
import {
  Container, Paper, Typography, TextField, Button,
  Box, AppBar, Toolbar, Avatar, Grid, Card, CardContent,
  CardActions, Badge, Switch, FormControlLabel, IconButton, Select, MenuItem, InputLabel, FormControl, OutlinedInput, Checkbox, ListItemText, Tooltip, CircularProgress, Popover
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import Chatbox from "./Chatbox";
import ErrorBoundary from "./ErrorBoundary";
import { io } from "socket.io-client";
import { useCall } from "./context/IncomingCallContext.jsx";
import { Google, GitHub, Brightness4, Brightness7, Videocam, CallEnd, Search, Settings, Logout, Add, Notifications, ChatBubble, PhotoCamera } from "@mui/icons-material";
import SpaceBackground from "./components/SpaceBackground";
import CustomCursor from "./components/CustomCursor";
import VideoCallModal from "./VideoCallModel";
import { createVideoCall } from "./VideoCallManager";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const StyledBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== "isOnline",
})(({ theme, isOnline }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: isOnline ? "#10b981" : "#94a3b8",
    color: isOnline ? "#10b981" : "#94a3b8",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      display: isOnline ? "block" : "none",
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": { transform: "scale(.8)", opacity: 1 },
    "100%": { transform: "scale(2.4)", opacity: 0 },
  },
}));

function WelcomeView({ onGetStarted, toggleTheme, themeMode }) {
  return (
    <Box className="auth-bg" sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: 4, textAlign: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <Avatar sx={{
              width: 110, height: 110, bgcolor: 'var(--primary)',
              boxShadow: '0 0 50px var(--primary-glow)',
              fontSize: '3.5rem', fontWeight: 900,
              border: '4px solid var(--glass-border)'
            }}>C</Avatar>
          </motion.div>
        </Box>
        <Typography variant="h1" className="poppins" sx={{
          fontWeight: 900,
          fontSize: { xs: '3.5rem', md: '5.5rem' },
          letterSpacing: '-3px',
          mb: 2,
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1
        }}>
          CONVEX
        </Typography>
        <Typography variant="h5" sx={{
          color: 'var(--text-dim)',
          maxWidth: 650,
          mx: 'auto',
          mb: 8,
          fontWeight: 400,
          lineHeight: 1.6,
          fontSize: { xs: '1.1rem', md: '1.25rem' }
        }}>
          Secure, seamless, and stunning. Experience the future of communication with end-to-end encryption and crystal-clear calls.
        </Typography>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={onGetStarted}
            className="shimmer"
            sx={{
              px: 8, py: 2.5, borderRadius: '50px',
              bgcolor: 'var(--primary)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.2rem',
              textTransform: 'none',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 15px 35px var(--primary-glow)',
              '&:hover': { bgcolor: 'var(--secondary)', transform: 'translateY(-2px)', boxShadow: '0 20px 40px var(--primary-glow)' },
              transition: 'all 0.4s'
            }}
          >
            Launch Application
          </Button>
        </motion.div>

        <Box sx={{ mt: 10 }}>
          <Typography variant="overline" sx={{ color: 'var(--text-dim)', letterSpacing: '3px', fontWeight: 700, opacity: 0.6 }}>
            DESIGNED & DEVELOPED BY
          </Typography>
          <Typography variant="h6" className="poppins" sx={{ fontWeight: 800, mt: 1, color: 'var(--text)', letterSpacing: '0.5px' }}>
            Utpal Raj
          </Typography>
        </Box>
      </motion.div>

      <Box sx={{ position: "absolute", top: 32, right: 32 }}>
        <IconButton onClick={toggleTheme} sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--glass-border)', color: 'var(--text)' }}>
          {themeMode === "dark" ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
        </IconButton>
      </Box>
    </Box>
  );
}

function AuthForm({ title, subtitle, onSubmit, extraButton, children, themeMode, toggleTheme, onBack }) {
  return (
    <Box className="auth-bg" sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        <Paper sx={{
          p: { xs: 4, md: 6 },
          maxWidth: 420,
          width: "100%",
          borderRadius: 5,
          position: "relative",
          bgcolor: 'var(--surface)',
          backdropFilter: 'blur(30px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
          overflow: 'hidden'
        }}>
          <Box sx={{ position: "absolute", top: 20, right: 20, display: 'flex', gap: 1 }}>
            <IconButton onClick={toggleTheme} size="small" sx={{ color: 'var(--text-dim)', border: '1px solid var(--glass-border)' }}>
              {themeMode === "dark" ? <Brightness7 fontSize="inherit" /> : <Brightness4 fontSize="inherit" />}
            </IconButton>
          </Box>

          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', mb: 1 }}>{title}</Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-dim)', fontWeight: 500 }}>{subtitle || "Secure your conversation today."}</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 4 }}>
            {children}
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={onSubmit}
            disableElevation
            sx={{
              py: 2,
              borderRadius: '12px',
              bgcolor: 'var(--primary)',
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '1rem',
              boxShadow: '0 8px 20px var(--primary-glow)',
              '&:hover': { bgcolor: 'var(--secondary)', transform: 'translateY(-2px)' },
              transition: '0.3s'
            }}
          >
            {title}
          </Button>

          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'center' }}>
            {extraButton}
            {onBack && (
              <Button variant="text" size="small" onClick={onBack} sx={{ textTransform: 'none', color: 'var(--text-dim)', fontWeight: 600 }}>
                Return to Welcome
              </Button>
            )}
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
}

export default function App() {
  const { user, setUser, logout } = useAuth();
  const { themeMode, toggleTheme } = useTheme();
  const { registerSocket, incomingCall, activeCall, acceptCall, rejectCall, endCall } = useCall();
  const [showGlobalIncoming, setShowGlobalIncoming] = useState(false);
  const localRef = useRef();
  const remoteRef = useRef();
  const callManagerRef = useRef(null);

  const [peer, setPeer] = useState(null);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [view, setView] = useState(user ? "chat" : "welcome");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [pendingOtp, setPendingOtp] = useState(null);
  const [otp, setOtp] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0: input, 1: otp
  const [newPassword, setNewPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notifAnchor, setNotifAnchor] = useState(null);

  // Notification Logic
  const handleIncomingMessage = (msg) => {
    if (!peer || peer.id !== msg.from) {
      setNotifications(prev => [...prev, { ...msg, read: false }]);
    }
  };

  useEffect(() => {
    if (!socket) return;
    socket.on("private:receive", handleIncomingMessage);
    return () => socket.off("private:receive", handleIncomingMessage);
  }, [socket, peer]);

  const handleNotifClick = (e) => {
    setNotifAnchor(e.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchor(null);
    setNotifications([]);
  };

  const handleSelectFromNotif = (senderId) => {
    const sender = list.find(u => u.id === senderId);
    if (sender) {
      setPeer(sender);
      setShowSettings(false);
    }
    handleNotifClose();
  };

  useEffect(() => {
    if (incomingCall) setShowGlobalIncoming(true);
    else setShowGlobalIncoming(false);
  }, [incomingCall]);

  const handleEndCall = () => {
    endCall();
  };

  useEffect(() => {
    if (activeCall && activeCall.status === 'connected' && socket) {
      if (!callManagerRef.current) {
        console.log('[App] Initializing VideoCallManager for', activeCall.to);
        callManagerRef.current = createVideoCall(socket, activeCall.to, localRef, remoteRef);

        if (activeCall.isInitiator) {
          console.log('[App] Initiator starting call...');
          callManagerRef.current.startCall();
        }
      }
    } else if (!activeCall) {
      if (callManagerRef.current) {
        console.log('[App] Ending call manager');
        callManagerRef.current.endCall();
        callManagerRef.current = null;
      }
    }
  }, [activeCall, socket]);

  useEffect(() => {
    if (!user?.token) return;
    const s = io(API_URL, {
      auth: { token: user.token },
      transports: ["websocket", "polling"],
      reconnection: true
    });
    setSocket(s);
    registerSocket(s);
    s.on("onlineUsers", list => setOnlineUsers(list));

    s.on("webrtc:offer", async ({ from, offer }) => {
      console.log("[App] Received webrtc:offer from", from);
      if (callManagerRef.current) {
        await callManagerRef.current.handleOffer(offer, from);
      }
    });

    s.on("webrtc:answer", async ({ from, answer }) => {
      console.log("[App] Received webrtc:answer from", from);
      if (callManagerRef.current) {
        await callManagerRef.current.handleAnswer(answer);
      }
    });

    s.on("webrtc:candidate", async ({ from, candidate }) => {
      console.log("[App] Received webrtc:candidate from", from);
      if (callManagerRef.current) {
        await callManagerRef.current.handleCandidate(candidate);
      }
    });

    return () => s.disconnect();
  }, [user, registerSocket]);

  useEffect(() => {
    if (!user?.token) return;
    fetch(`${API_URL}/auth/users`, {
      headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setList(data.filter(u => u.id !== user.id));
        }
      })
      .catch(err => console.error("Failed to fetch users", err));
  }, [user]);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ token: data.token, username: data.user.username, id: data.user.id });
        setView("chat");
      } else { alert(data.error || "Login failed"); }
    } catch (err) { alert("Login failed"); }
  };

  const handleRegister = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setPendingOtp({ username, email });
        setOtp("");
        alert("Registered! Please enter the OTP sent to your email.");
      } else { alert(data.error || "Registration failed"); }
    } catch (err) { console.error(err); }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: pendingOtp.username, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("OTP verified! You can now log in.");
        setPendingOtp(null);
        setView("login");
      } else { alert(data.error || "OTP verification failed"); }
    } catch (err) { console.error(err); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("id", user.id);

    try {
      const res = await fetch(`${API_URL}/auth/upload-avatar`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ ...user, avatar: data.avatar });
        alert("Profile picture updated!");
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Failed to upload avatar");
    }
  };

  const requestPasswordReset = async () => {
    if (!resetEmail.trim()) return alert("Please enter your registered email.");
    try {
      const res = await fetch(`${API_URL}/auth/request-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetStep(1);
        alert(data.message || "OTP sent to your email!");
      } else { alert(data.error || "Failed to send OTP. Ensure the email is registered."); }
    } catch (err) { alert("Server error while requesting OTP. Please try again later."); }
  };

  const handlePasswordReset = async () => {
    if (!otp.trim() || !newPassword.trim()) return alert("Please fill in all fields.");
    try {
      const res = await fetch(`${API_URL}/auth/change-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp: otp.trim(), newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Password reset successfully! You can continue using the app.");
        setResetStep(0);
        setOtp("");
        setNewPassword("");
        setShowSettings(false);
      } else { alert(data.error || "Failed to reset password. Check your OTP."); }
    } catch (err) { alert("Server error. Please try again."); }
  };

  if (view === "welcome") return (
    <>
      <CustomCursor />
      <SpaceBackground themeMode={themeMode} />
      <WelcomeView onGetStarted={() => setView('login')} toggleTheme={toggleTheme} themeMode={themeMode} />
    </>
  );

  if (view === "login") return (
    <>
      <CustomCursor />
      <SpaceBackground themeMode={themeMode} />
      <AuthForm title="Welcome Back" subtitle="Please enter your credentials to continue." onSubmit={handleLogin} themeMode={themeMode} toggleTheme={toggleTheme} onBack={() => setView('welcome')}
        extraButton={<Button variant="text" fullWidth onClick={() => setView('register')} sx={{ textTransform: 'none', fontWeight: 700 }}>Don't have an account? Sign Up</Button>}>
        <TextField fullWidth label="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <TextField fullWidth label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <Box sx={{ textAlign: 'right' }}>
          <Button variant="text" size="small" onClick={() => setView('reset')} sx={{ textTransform: 'none', color: 'var(--text-dim)' }}>Forgot Password?</Button>
        </Box>
      </AuthForm>
    </>
  );

  if (pendingOtp) return (
    <>
      <CustomCursor />
      <SpaceBackground themeMode={themeMode} />
      <AuthForm title="Verify Account" subtitle={`We've sent an OTP to ${pendingOtp.email}`} onSubmit={handleVerifyOtp} themeMode={themeMode} toggleTheme={toggleTheme}>
        <TextField fullWidth label="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} />
      </AuthForm>
    </>
  );

  if (view === "register") return (
    <>
      <CustomCursor />
      <SpaceBackground themeMode={themeMode} />
      <AuthForm title="Join Convex" subtitle="Start your journey into secure messaging." onSubmit={handleRegister} themeMode={themeMode} toggleTheme={toggleTheme} onBack={() => setView('login')}
        extraButton={<Button variant="text" fullWidth onClick={() => setView('login')} sx={{ textTransform: 'none', fontWeight: 700 }}>Already have an account? Log In</Button>}>
        <TextField fullWidth label="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <TextField fullWidth label="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <TextField fullWidth label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      </AuthForm>
    </>
  );

  if (view === "reset") return (
    <>
      <CustomCursor />
      <SpaceBackground themeMode={themeMode} />
      <AuthForm title="Reset Password" subtitle="Follow the steps to regain access." onSubmit={resetStep === 0 ? requestPasswordReset : handlePasswordReset} themeMode={themeMode} toggleTheme={toggleTheme} onBack={() => setView('login')}>
        {resetStep === 0 ? (
          <TextField fullWidth label="Registered Email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
        ) : (
          <>
            <TextField fullWidth label="OTP Code" value={otp} onChange={e => setOtp(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </>
        )}
      </AuthForm>
    </>
  );

  const filteredUsers = list.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <CustomCursor />
      <SpaceBackground themeMode={themeMode} />
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'var(--background)', color: 'var(--text)', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Sidebar - More compact and distinct */}
        <Box sx={{
          width: 72,
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 3,
          gap: 4,
          bgcolor: 'var(--bg-sidebar)',
          zIndex: 10
        }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Avatar
              src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`) : "/logo.png"}
              sx={{ width: 55, height: 55, bgcolor: 'var(--primary)', mb: 2, boxShadow: '0 0 20px var(--primary-glow)', border: '2px solid var(--glass-border)', cursor: 'pointer' }}
            >
              {user?.username?.[0] || 'C'}
            </Avatar>
          </motion.div>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <Tooltip title="Chats" placement="right">
              <IconButton
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(false)}
                sx={{
                  color: !showSettings ? 'var(--primary)' : 'var(--text-dim)',
                  bgcolor: !showSettings ? 'var(--primary-glow)' : 'transparent',
                  p: 1.5,
                  borderRadius: '12px',
                  transition: '0.2s'
                }}
              >
                <ChatBubble />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications" placement="right">
              <IconButton
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNotifClick}
                sx={{ color: 'var(--text-dim)', p: 1.5 }}
              >
                <Badge badgeContent={notifications.length} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={handleNotifClose}
              anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
              transformOrigin={{ vertical: 'center', horizontal: 'left' }}
              PaperProps={{ sx: { width: 300, maxHeight: 400, bgcolor: 'var(--surface)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow)', borderRadius: 2 } }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid var(--glass-border)' }}>
                <Typography variant="h6" className="poppins" sx={{ fontWeight: 700 }}>Notifications</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center', color: 'var(--text-dim)' }}>No new notifications</Box>
                ) : (
                  notifications.map((notif, i) => {
                    const sender = list.find(u => u.id === notif.from);
                    return (
                      <Box
                        key={i}
                        onClick={() => handleSelectFromNotif(notif.from)}
                        sx={{
                          p: 2,
                          borderBottom: '1px solid var(--glass-border)',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <Avatar sx={{ bgcolor: 'var(--primary)', width: 40, height: 40 }}>{sender?.username?.[0] || '?'}</Avatar>
                        <Box sx={{ overflow: 'hidden' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{sender?.username || "Unknown"}</Typography>
                          <Typography variant="body2" noWrap sx={{ color: 'var(--text-dim)' }}>
                            {notif.type === 'text' ? notif.text : `Sent a ${notif.type}`}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Popover>
            <Tooltip title="Settings" placement="right">
              <IconButton
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(true)}
                sx={{
                  color: showSettings ? 'var(--primary)' : 'var(--text-dim)',
                  bgcolor: showSettings ? 'var(--primary-glow)' : 'transparent',
                  p: 1.5,
                  borderRadius: '12px',
                  transition: '0.2s'
                }}
              >
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <IconButton
              component={motion.button}
              whileHover={{ rotate: 180 }}
              onClick={toggleTheme}
              sx={{ color: 'var(--text-dim)' }}
            >
              {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <Tooltip title="Logout" placement="right">
              <IconButton
                component={motion.button}
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { logout(); setView('login'); }}
                sx={{ color: 'var(--accent)' }}
              >
                <Logout />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* User List Panel - Cleaner search and list */}
        <Box sx={{
          width: 320,
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'var(--surface)',
          backdropFilter: 'blur(20px)'
        }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" className="poppins" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>Messages</Typography>
            </Box>
            <TextField
              fullWidth
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'var(--text-dim)', fontSize: 18 }} />,
                sx: {
                  borderRadius: '10px',
                  bgcolor: 'rgba(0,0,0,0.05)',
                  border: '1px solid var(--glass-border)',
                  height: 40,
                  px: 1.5,
                  fontSize: '0.9rem'
                }
              }}
              variant="standard"
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
            <AnimatePresence>
              {filteredUsers.map((u, index) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Box
                    onClick={() => setPeer(u)}
                    sx={{
                      p: 1.5, mb: 0.5, borderRadius: '12px', cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      bgcolor: peer?.id === u.id ? 'var(--primary-glow)' : 'transparent',
                      position: 'relative',
                      '&:hover': { bgcolor: peer?.id === u.id ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)', transform: 'translateX(4px)' }
                    }}>
                    <StyledBadge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" isOnline={onlineUsers.includes(u.id)}>
                      <Avatar
                        src={u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${API_URL}${u.avatar}`) : ""}
                        sx={{ width: 44, height: 44, bgcolor: 'var(--secondary)', border: '1px solid var(--glass-border)' }}
                      >
                        {u.username[0]}
                      </Avatar>
                    </StyledBadge>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.username}</Typography>
                      <Typography variant="caption" sx={{ color: onlineUsers.includes(u.id) ? '#10b981' : 'var(--text-dim)', fontWeight: 500 }}>
                        {onlineUsers.includes(u.id) ? 'Active now' : 'Offline'}
                      </Typography>
                    </Box>
                    {peer?.id === u.id && (
                      <motion.div layoutId="active-pill" style={{ position: 'absolute', left: -6, width: 4, height: 20, background: 'var(--primary)', borderRadius: 2 }} />
                    )}
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        </Box>

        {/* Main Chat Area - More focused */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', bgcolor: 'var(--bg-main)' }}>
          <AnimatePresence mode="wait">
            {showSettings ? (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ height: '100%', padding: '40px' }}>
                <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                  <Typography variant="h4" className="poppins" sx={{ fontWeight: 800, mb: 4 }}>Account Settings</Typography>

                  <Paper className="glass" sx={{ p: 4, borderRadius: 5, mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Profile Information</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`) : ""}
                          sx={{ width: 100, height: 100, border: '3px solid var(--primary)', boxShadow: '0 0 15px var(--primary-glow)' }}
                        >
                          {user?.username?.[0]}
                        </Avatar>
                        <IconButton
                          component="label"
                          sx={{
                            position: 'absolute', bottom: -5, right: -5,
                            bgcolor: 'var(--primary)', color: '#fff',
                            '&:hover': { bgcolor: 'var(--secondary)' },
                            width: 35, height: 35
                          }}
                        >
                          <PhotoCamera sx={{ fontSize: 20 }} />
                          <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                        </IconButton>
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{user?.username}</Typography>
                        <Typography variant="body2" sx={{ color: 'var(--text-dim)' }}>Update your profile picture and secure your account</Typography>
                      </Box>
                    </Box>
                  </Paper>

                  <Paper className="glass" sx={{ p: 4, borderRadius: 5 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Reset Password</Typography>

                    {resetStep === 0 ? (
                      <Box>
                        <Typography sx={{ color: 'var(--text-dim)', mb: 2 }}>Enter your registered email to receive an OTP.</Typography>
                        <TextField fullWidth label="Registered Email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} sx={{ mb: 3 }} />
                        <Button fullWidth variant="contained" onClick={requestPasswordReset} className="premium-button" sx={{ py: 1.5 }}>Send OTP</Button>
                      </Box>
                    ) : (
                      <Box>
                        <Typography sx={{ color: 'var(--text-dim)', mb: 2 }}>Enter the OTP sent to your email and your new password.</Typography>
                        <TextField fullWidth label="OTP Code" value={otp} onChange={e => setOtp(e.target.value)} sx={{ mb: 2 }} />
                        <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} sx={{ mb: 3 }} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button fullWidth variant="outlined" onClick={() => setResetStep(0)}>Back</Button>
                          <Button fullWidth variant="contained" onClick={handlePasswordReset} className="premium-button">Change Password</Button>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Box>
              </motion.div>
            ) : peer ? (
              <motion.div key={peer.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }} style={{ height: '100%' }}>
                <Chatbox user={user} peer={peer} onBack={() => setPeer(null)} socket={socket} />
              </motion.div>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 0.1 }} transition={{ duration: 1 }}>
                  <ChatBubble sx={{ fontSize: 200, color: 'var(--primary)' }} />
                </motion.div>
                <Typography variant="h5" className="poppins" sx={{ mt: -4, fontWeight: 700, opacity: 0.4 }}>Send a secure message</Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.3 }}>Select a conversation to start chatting</Typography>
              </Box>
            )}
          </AnimatePresence>
        </Box>

        {/* Call Handlers */}
        <AnimatePresence>
          {showGlobalIncoming && (
            <Modal open={true} onClose={rejectCall} closeAfterTransition>
              <Box sx={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, bgcolor: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(20px)' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  style={{ textAlign: 'center', p: 5 }}>
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Avatar className="ring-active" sx={{ width: 140, height: 140, mx: 'auto', mb: 4, bgcolor: 'var(--primary)', border: '5px solid var(--glass-border)', fontSize: 50 }}>
                      {incomingCall?.name ? incomingCall.name.charAt(0) : '?'}
                    </Avatar>
                  </motion.div>
                  <Typography variant="h4" className="poppins" sx={{ fontWeight: 900, mb: 1 }}>{incomingCall?.name || 'Someone'}</Typography>
                  <Typography variant="h6" sx={{ color: 'var(--text-dim)', mb: 6, fontWeight: 500 }}>Incoming {incomingCall?.type || 'call'} call...</Typography>
                  <Box sx={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                    <IconButton onClick={acceptCall} sx={{ bgcolor: '#10b981', color: '#fff', width: 80, height: 80, '&:hover': { bgcolor: '#059669', transform: 'scale(1.1)' }, transition: '0.3s' }}>
                      <Videocam sx={{ fontSize: 35 }} />
                    </IconButton>
                    <IconButton onClick={rejectCall} sx={{ bgcolor: '#ef4444', color: '#fff', width: 80, height: 80, '&:hover': { bgcolor: '#dc2626', transform: 'scale(1.1)' }, transition: '0.3s' }}>
                      <CallEnd sx={{ fontSize: 35 }} />
                    </IconButton>
                  </Box>
                </motion.div>
              </Box>
            </Modal>
          )}
        </AnimatePresence>

        {/* Outgoing Call Overlay */}
        <Modal open={!!activeCall && activeCall.status === 'ringing'} onClose={handleEndCall} closeAfterTransition>
          <Box sx={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, bgcolor: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(20px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Avatar className="ring-active" sx={{ width: 140, height: 140, mx: 'auto', mb: 4, bgcolor: 'var(--primary)', border: '5px solid var(--glass-border)', fontSize: 50 }}>
                  {peer?.username ? peer.username.charAt(0) : '?'}
                </Avatar>
              </motion.div>
              <Typography variant="h4" className="poppins" sx={{ fontWeight: 900, mb: 1 }}>Calling {activeCall?.name || peer?.username || 'User'}...</Typography>
              <Typography variant="h6" sx={{ color: 'var(--text-dim)', mb: 6, fontWeight: 500 }}>Ringing...</Typography>
              <IconButton onClick={handleEndCall} sx={{ bgcolor: '#ef4444', color: '#fff', width: 80, height: 80, '&:hover': { bgcolor: '#dc2626', transform: 'scale(1.1)' }, transition: '0.3s' }}>
                <CallEnd sx={{ fontSize: 35 }} />
              </IconButton>
            </motion.div>
          </Box>
        </Modal>

        <VideoCallModal show={!!activeCall && activeCall.status === 'connected'} localRef={localRef} remoteRef={remoteRef} onEnd={handleEndCall} type={activeCall?.type} peerName={activeCall?.name || peer?.username} />
      </Box>
    </>
  );
}
