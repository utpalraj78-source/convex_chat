// src/context/IncomingCallContext.js
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  const registerSocket = useCallback((sock) => {
    setSocket(sock);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleCallRequest = (data) => {
      setIncomingCall(data);
    };

    socket.on("call:request", handleCallRequest);

    return () => {
      socket.off("call:request", handleCallRequest);
    };
  }, [socket]);

  const acceptCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    socket.emit("call:answer", { to: incomingCall.from, accepted: true });
    setActiveCall(incomingCall);
    setIncomingCall(null);
  }, [socket, incomingCall]);

  const rejectCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    socket.emit("call:answer", { to: incomingCall.from, accepted: false });
    setIncomingCall(null);
  }, [socket, incomingCall]);

  const startCall = useCallback((to, type) => {
    if (!socket) return;
    socket.emit("call:request", { to, type });
    setActiveCall({ to, type });
  }, [socket]);

  const endCall = useCallback(() => {
    if (!socket || !activeCall) return;
    socket.emit("call:end", { to: activeCall.to });
    setActiveCall(null);
  }, [socket, activeCall]);

  const contextValue = useMemo(() => ({
    incomingCall,
    activeCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    registerSocket
  }), [incomingCall, activeCall, startCall, acceptCall, rejectCall, endCall, registerSocket]);
  return (
    <CallContext.Provider value={contextValue}>
      {children}
    </CallContext.Provider>
  );
}


CallProvider.propTypes = {
  children: PropTypes.node,
};

export const useCall = () => useContext(CallContext);
