import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal, Box, IconButton, Typography, Avatar, Fade, Paper } from "@mui/material";
import { CallEnd, Mic, MicOff, Videocam, VideocamOff, ScreenShare, VolumeUp } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

function VideoCallModal({ show, localRef, remoteRef, onEnd, type, peerName }) {
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(type === 'video');
  const [remoteAttached, setRemoteAttached] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (remoteRef.current?.srcObject && remoteRef.current.srcObject.active) {
        setRemoteAttached(true);
      } else {
        setRemoteAttached(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [remoteRef, show]);

  useEffect(() => {
    setCameraOn(type === 'video');
  }, [type, show]);

  const toggleMute = () => {
    if (localRef.current?.srcObject) {
      localRef.current.srcObject.getAudioTracks().forEach(t => t.enabled = muted);
    }
    setMuted(!muted);
  };

  const toggleCamera = () => {
    if (localRef.current?.srcObject) {
      localRef.current.srcObject.getVideoTracks().forEach(t => t.enabled = !cameraOn);
    }
    setCameraOn(!cameraOn);
  };

  return (
    <Modal open={show} onClose={onEnd} closeAfterTransition>
      <Fade in={show}>
        <Box sx={{
          position: 'fixed', inset: 0, bgcolor: '#020617', display: 'flex', flexDirection: 'column',
          zIndex: 5000, color: '#fff', overflow: 'hidden'
        }}>
          {/* Background Ambient Glow */}
          <Box sx={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.15, zIndex: 0 }}>
            <Box sx={{ position: 'absolute', width: 600, height: 600, background: 'var(--primary)', filter: 'blur(200px)', top: '-20%', left: '-10%' }} />
            <Box sx={{ position: 'absolute', width: 600, height: 600, background: 'var(--secondary)', filter: 'blur(200px)', bottom: '-20%', right: '-10%' }} />
          </Box>

          {/* Main Stage */}
          <Box sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, md: 4 }, zIndex: 1 }}>

            {/* Remote Video Container */}
            <Paper component={motion.div}
              layout
              sx={{
                width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden',
                bgcolor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}>
              <video ref={remoteRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

              {!remoteAttached && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)' }}>
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Avatar sx={{ width: 160, height: 160, mb: 4, bgcolor: 'var(--primary)', fontSize: 60, border: '6px solid var(--glass-border)', boxShadow: '0 0 50px var(--primary-glow)' }}>
                      {peerName ? peerName.charAt(0) : '?'}
                    </Avatar>
                  </motion.div>
                  <Typography variant="h4" className="poppins" sx={{ fontWeight: 800, letterSpacing: 1, mb: 1 }}>{peerName || 'Connecting...'}</Typography>
                  <Typography variant="subtitle1" sx={{ color: 'var(--text-dim)', letterSpacing: 2 }}>STABLISHING CONNECTION</Typography>
                </Box>
              )}
            </Paper>

            {/* Local Video Draggable Preview */}
            <motion.div
              drag
              dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
              style={{
                position: 'absolute', right: 40, bottom: 40, width: 220, height: 150, zIndex: 2
              }}
            >
              <Paper sx={{
                width: '100%', height: '100%', borderRadius: 4, overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.2)', bgcolor: '#000',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative'
              }}>
                <video ref={localRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {!cameraOn && (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1e293b' }}>
                    <VideocamOff sx={{ opacity: 0.5 }} />
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Box>

          {/* Controls Bar - Floating Style */}
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <Box component={motion.div}
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              sx={{
                display: 'flex', alignItems: 'center', gap: { xs: 2, md: 4 }, px: 4, py: 2,
                bgcolor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(20px)',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
              }}>

              <IconButton onClick={toggleMute} sx={{ bgcolor: muted ? 'var(--accent)' : 'rgba(255,255,255,0.1)', color: '#fff', p: 2 }}>
                {muted ? <MicOff /> : <Mic />}
              </IconButton>

              {type === 'video' && (
                <IconButton onClick={toggleCamera} sx={{ bgcolor: !cameraOn ? 'var(--accent)' : 'rgba(255,255,255,0.1)', color: '#fff', p: 2 }}>
                  {!cameraOn ? <VideocamOff /> : <Videocam />}
                </IconButton>
              )}

              <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', p: 2 }}><ScreenShare /></IconButton>
              <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', p: 2 }}><VolumeUp /></IconButton>

              <IconButton onClick={onEnd}
                sx={{
                  bgcolor: '#ef4444', color: '#fff', p: 2.5,
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
                  '&:hover': { bgcolor: '#dc2626', transform: 'scale(1.1)' },
                  transition: '0.3s'
                }}>
                <CallEnd sx={{ fontSize: 32 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

VideoCallModal.propTypes = {
  show: PropTypes.bool.isRequired,
  localRef: PropTypes.object.isRequired,
  remoteRef: PropTypes.object.isRequired,
  onEnd: PropTypes.func.isRequired,
  type: PropTypes.string,
  peerName: PropTypes.string
};

export default VideoCallModal;
