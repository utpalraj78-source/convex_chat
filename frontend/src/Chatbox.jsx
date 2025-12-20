import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, TextField, IconButton, Avatar, Paper, Popover, CircularProgress } from "@mui/material";
import { Send, AttachFile, SentimentSatisfiedAlt, Mic, Call, Videocam, MoreVert, Close, Download, InsertDriveFile } from "@mui/icons-material";
import { format } from "date-fns";
import useSound from "use-sound";
import { useCall } from "./context/IncomingCallContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "./App.jsx";

export default function Chatbox({ user, peer, onBack, socket }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const { startCall } = useCall();
  const fileInputRef = useRef(null);
  const [recorder, setRecorder] = useState(null);
  const messagesEndRef = useRef(null);
  const [playSend] = useSound("/sounds/send.mp3", { volume: 0.5 });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let mounted = true;
    const peerId = peer.id;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/messages/${peerId}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (mounted) {
          setMessages(data.map(msg => ({
            ...msg,
            time: new Date(msg.time || msg.createdAt)
          })).sort((a, b) => a.time - b.time));
        }
      } catch (err) { console.error(err); }
      finally { if (mounted) setIsLoading(false); }
    };

    fetchHistory();

    if (socket) {
      const handleReceive = (msg) => {
        setMessages(prev => {
          const isDuplicate = prev.some(m => {
            const mId = m._id?.toString();
            const msgId = msg._id?.toString();
            const mTempId = m.tempId?.toString();
            const msgTempId = msg.tempId?.toString();

            return (msgId && mId === msgId) || (msgTempId && mTempId === msgTempId);
          });

          if (isDuplicate) return prev;
          return [...prev, { ...msg, time: new Date(msg.time || msg.createdAt) }].sort((a, b) => a.time - b.time);
        });
      };
      socket.on("private:receive", handleReceive);
      return () => {
        mounted = false;
        socket.off("private:receive", handleReceive);
      };
    }
    return () => { mounted = false; };
  }, [user.id, peer, user.token, socket]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !socket) return;
    setIsSending(true);
    const toId = peer.id;
    const tempId = `text-${Date.now()}`;
    const tempMsg = { from: user.id, to: toId, text: input.trim(), time: new Date(), type: "text", tempId };

    setMessages(prev => [...prev, tempMsg]);
    setInput("");
    playSend();

    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: toId, text: tempMsg.text, type: 'text' })
      });
      const savedMsg = await res.json();
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...savedMsg, time: new Date(savedMsg.createdAt), tempId } : m));
      socket.emit("private:send", { ...savedMsg, to: toId, tempId });
    } catch (err) { setMessages(prev => prev.filter(m => m.tempId !== tempId)); }
    finally { setIsSending(false); }
  }, [input, socket, user.id, peer, playSend, user.token]);

  const startRecording = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const toId = peer.id;
        const tempId = `voice-${Date.now()}`;
        const tempMsg = { to: toId, from: user.id, type: "voice", fileUrl: URL.createObjectURL(blob), tempId, time: new Date(), uploading: true };
        setMessages(prev => [...prev, tempMsg]);
        playSend();
        const formData = new FormData();
        formData.append("voice", blob, `voice-${Date.now()}.webm`);
        formData.append("from", user.id);
        formData.append("to", toId);
        try {
          const res = await fetch(`${API_URL}/messages/voice`, {
            method: "POST",
            headers: { Authorization: `Bearer ${user.token}` },
            body: formData,
          });
          const data = await res.json();
          const fileUrl = data.fileUrl.startsWith("http") ? data.fileUrl : `${API_URL}${data.fileUrl}`;
          const realMsg = { ...data, to: toId, from: user.id, type: "voice", fileUrl, time: new Date(data.createdAt), tempId };
          setMessages(prev => prev.map(m => m.tempId === tempId ? realMsg : m));
          socket.emit("private:send", realMsg);
        } catch (err) { setMessages(prev => prev.filter(m => m.tempId !== tempId)); }
      };
      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setRecording(true);
    } catch (err) { console.error(err); }
  };

  const handleStartCall = (type) => {
    startCall(peer.id, peer.username, type);
  };

  const handleEmojiClick = (emoji) => {
    setInput(prev => prev + emoji);
    setEmojiAnchor(null);
  };

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toId = peer.id;
    const tempId = `file-${Date.now()}`;
    const tempMsg = { to: toId, from: user.id, type: "file", fileName: file.name, fileSize: file.size, tempId, time: new Date(), uploading: true };
    setMessages(prev => [...prev, tempMsg]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("from", user.id);
    formData.append("to", toId);

    try {
      const res = await fetch(`${API_URL}/messages/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      });
      const data = await res.json();
      const realMsg = { ...data, to: toId, from: user.id, type: "file", time: new Date(data.createdAt), tempId };
      setMessages(prev => prev.map(m => m.tempId === tempId ? realMsg : m));
      socket.emit("private:send", realMsg);
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
    }
  };

  const stopRecording = () => {
    if (!recorder) return;
    recorder.stop();
    recorder.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'transparent' }}>
      {/* Chat Header - Professional look */}
      <Box sx={{
        p: 2,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--glass-border)',
        bgcolor: 'var(--surface)',
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={peer.avatar ? (peer.avatar.startsWith('http') ? peer.avatar : `${API_URL}${peer.avatar}`) : ""}
              sx={{ width: 42, height: 42, bgcolor: 'var(--primary)', border: '1px solid var(--glass-border)' }}
            >
              {peer.username[0]}
            </Avatar>
            <Box sx={{
              position: 'absolute', bottom: 2, right: 2,
              width: 10, height: 10, bgcolor: '#10b981',
              borderRadius: '50%', border: '2px solid var(--surface)'
            }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{peer.username}</Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-dim)', fontWeight: 500 }}>Online</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1, bgcolor: 'var(--primary-glow)' }}
            whileTap={{ scale: 0.9 }}
            sx={{ color: 'var(--text-dim)' }}
            onClick={() => handleStartCall('audio')}
          >
            <Call />
          </IconButton>
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1, bgcolor: 'var(--primary-glow)' }}
            whileTap={{ scale: 0.9 }}
            sx={{ color: 'var(--text-dim)' }}
            onClick={() => handleStartCall('video')}
          >
            <Videocam />
          </IconButton>
          <IconButton sx={{ color: 'var(--text-dim)' }}><MoreVert /></IconButton>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isMine = msg.from === user.id;
              return (
                <motion.div
                  key={msg._id || msg.tempId || i}
                  initial={{ opacity: 0, scale: 0.8, y: 20, x: isMine ? 20 : -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                    layout: { duration: 0.3 }
                  }}
                  layout
                  style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}
                >
                  <Box sx={{
                    p: 1.5,
                    px: 2,
                    borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    bgcolor: isMine ? 'var(--primary)' : 'var(--surface)',
                    color: isMine ? '#fff' : 'var(--text)',
                    boxShadow: isMine ? '0 8px 25px var(--primary-glow)' : '0 4px 15px rgba(0,0,0,0.05)',
                    border: isMine ? 'none' : '1px solid var(--glass-border)',
                    position: 'relative'
                  }}>
                    {msg.type === "text" && <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>{msg.text}</Typography>}
                    {msg.type === "voice" && (
                      <audio controls src={msg.fileUrl.startsWith('http') || msg.fileUrl.startsWith('blob:') ? msg.fileUrl : `${API_URL}${msg.fileUrl}`}
                        style={{ width: 220, filter: isMine ? 'invert(1)' : 'none' }} />
                    )}
                    {msg.type === "file" && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                        <InsertDriveFile color="inherit" />
                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{msg.fileName}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>{(msg.fileSize / 1024).toFixed(1)} KB</Typography>
                        </Box>
                        <IconButton size="small" component="a" href={`${API_URL}${msg.fileUrl}`} download target="_blank" sx={{ color: '#fff' }}>
                          <Download fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7, textAlign: 'right', fontSize: '0.7rem' }}>
                      {format(new Date(msg.time), "HH:mm")}
                    </Typography>
                  </Box>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area - SaaS Style */}
      <Box sx={{ p: 2, px: 3, borderTop: '1px solid var(--glass-border)', bgcolor: 'var(--surface)' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, p: 0.5, px: 1.5,
          bgcolor: 'rgba(0,0,0,0.05)', borderRadius: '24px', border: '1px solid var(--glass-border)',
        }}>
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            size="small"
            sx={{ color: 'var(--text-dim)' }}
            onClick={(e) => setEmojiAnchor(e.currentTarget)}
          >
            <SentimentSatisfiedAlt fontSize="small" />
          </IconButton>
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            size="small"
            sx={{ color: 'var(--text-dim)' }}
            onClick={() => fileInputRef.current.click()}
          >
            <AttachFile fontSize="small" />
          </IconButton>
          <input type="file" hidden ref={fileInputRef} onChange={onFileChange} />

          <TextField
            fullWidth
            placeholder="Write a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === "Enter" && sendMessage()}
            variant="standard"
            InputProps={{ disableUnderline: true, sx: { fontSize: '0.9rem', px: 1 } }}
          />
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            size="small"
            onClick={recording ? stopRecording : startRecording}
            sx={{ color: recording ? 'var(--accent)' : 'var(--text-dim)', animation: recording ? 'ring-pulse 1.5s infinite' : 'none' }}
          >
            <Mic fontSize="small" />
          </IconButton>
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.15, rotate: -15 }}
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            sx={{ color: 'var(--primary)', '&:hover': { color: 'var(--secondary)' }, transition: '0.3s' }}
          >
            <Send sx={{ fontSize: 24 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{ sx: { p: 1, borderRadius: 3, bgcolor: 'var(--background)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow)' } }}
      >
        <Box sx={{ p: 1, width: 220, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {['😀', '😂', '😍', '😎', '🙏', '👍', '🔥', '❤️', '✨', '🎉', '😢', '🤔', '🙌', '🚀', '💯'].map(emoji => (
            <IconButton key={emoji} size="small" onClick={() => handleEmojiClick(emoji)} sx={{ fontSize: '1.2rem' }}>
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Box>
  );
}
