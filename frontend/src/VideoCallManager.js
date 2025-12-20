// VideoCallManager.js
export function createVideoCall(socket, peerId, localRef, remoteRef) {
  console.log('[WebRTC] Creating RTCPeerConnection for', peerId);
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  });

  let localStream = null;
  let remoteStream = null;
  const iceQueue = [];

  const updateRefs = () => {
    if (localStream && localRef.current && localRef.current.srcObject !== localStream) {
      console.log('[WebRTC] Attaching local stream to ref');
      localRef.current.srcObject = localStream;
    }
    if (remoteStream && remoteRef.current && remoteRef.current.srcObject !== remoteStream) {
      console.log('[WebRTC] Attaching remote stream to ref');
      remoteRef.current.srcObject = remoteStream;
      // Ensure audio plays
      remoteRef.current.play().catch(e => console.error("[WebRTC] Auto-play failed:", e));
    }
  };

  // Check for refs every 500ms while active
  const refInterval = setInterval(updateRefs, 500);

  // ---- ICE Candidates ----
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('[WebRTC] Sending ICE candidate');
      socket.emit("webrtc:candidate", { to: peerId, candidate: event.candidate });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log('[WebRTC] Connection state changed:', pc.connectionState);
  };

  // ---- Remote Stream ----
  pc.ontrack = (event) => {
    console.log('[WebRTC] Received remote track:', event.track.kind);
    if (event.streams && event.streams[0]) {
      remoteStream = event.streams[0];
      updateRefs();
    } else {
      // Fallback if streams array is not provided
      if (!remoteStream) remoteStream = new MediaStream();
      remoteStream.addTrack(event.track);
      updateRefs();
    }
  };

  // ---- Local Media + Offer ----
  const startCall = async () => {
    try {
      console.log('[WebRTC] Starting call (Initiator)');
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      updateRefs();

      localStream.getTracks().forEach((track) => {
        console.log('[WebRTC] Adding local track:', track.kind);
        pc.addTrack(track, localStream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc:offer", { to: peerId, offer });
    } catch (error) {
      console.error('[WebRTC] Error in startCall:', error);
    }
  };

  const processIceQueue = async () => {
    while (iceQueue.length > 0) {
      const candidate = iceQueue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[WebRTC] Error adding queued ICE candidate", err);
      }
    }
  };

  const handleOffer = async (offer, from) => {
    if (pc.connectionState === "closed") return;
    try {
      console.log('[WebRTC] Handling offer from', from);
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      updateRefs();

      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc:answer", { to: from, answer });
      await processIceQueue();
    } catch (error) {
      console.error('[WebRTC] Error in handleOffer:', error);
    }
  };

  const handleAnswer = async (answer) => {
    if (pc.connectionState === "closed") return;
    try {
      console.log('[WebRTC] Handling answer');
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await processIceQueue();
    } catch (err) {
      console.error("[WebRTC] Error in handleAnswer:", err);
    }
  };

  const handleCandidate = async (candidate) => {
    if (pc.connectionState === "closed") return;
    if (!pc.remoteDescription) {
      console.log('[WebRTC] Queuing ICE candidate');
      iceQueue.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("[WebRTC] Error adding received ICE candidate", err);
    }
  };

  const endCall = () => {
    console.log('[WebRTC] Ending call');
    clearInterval(refInterval);
    pc.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
        console.log('[WebRTC] Stopped local track:', sender.track.kind);
      }
    });
    pc.close();

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      localStream = null;
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((t) => t.stop());
      remoteStream = null;
    }
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;
  };

  return { startCall, handleOffer, handleAnswer, handleCandidate, endCall };
}
