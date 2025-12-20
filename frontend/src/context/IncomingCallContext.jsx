import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

const CallContext = createContext(null);

export function CallProvider({ children }) {
	const [socket, setSocket] = useState(null);
	const [incomingCall, setIncomingCall] = useState(null); // { from, name, type }
	const [activeCall, setActiveCall] = useState(null); // { to, type, status: 'ringing' | 'connected', isInitiator: boolean }

	const registerSocket = useCallback((sock) => {
		setSocket(sock);
	}, []);

	useEffect(() => {
		if (!socket) return;

		const handleCallRequest = (data) => {
			console.log('[IncomingCallContext] Received call:request', data);
			setIncomingCall(data);
		};

		const handleCallAnswer = (data) => {
			console.log('[IncomingCallContext] Received call:answer', data);
			if (data.accepted) {
				setActiveCall(prev => prev ? { ...prev, status: 'connected', name: data.name } : null);
			} else {
				setActiveCall(null);
				alert("Call rejected");
			}
		};

		const handleCallEnd = () => {
			console.log('[IncomingCallContext] Received call:end');
			setActiveCall(null);
			setIncomingCall(null);
		};

		socket.on("call:request", handleCallRequest);
		socket.on("call:answer", handleCallAnswer);
		socket.on("call:end", handleCallEnd);

		return () => {
			socket.off("call:request", handleCallRequest);
			socket.off("call:answer", handleCallAnswer);
			socket.off("call:end", handleCallEnd);
		};
	}, [socket]);

	const acceptCall = useCallback(() => {
		if (!socket || !incomingCall) return;
		socket.emit("call:answer", { to: incomingCall.from, accepted: true, type: incomingCall.type });
		setActiveCall({
			to: incomingCall.from,
			name: incomingCall.name,
			type: incomingCall.type,
			status: 'connected',
			isInitiator: false
		});
		setIncomingCall(null);
	}, [socket, incomingCall]);

	const rejectCall = useCallback(() => {
		if (!socket || !incomingCall) return;
		socket.emit("call:answer", { to: incomingCall.from, accepted: false });
		setIncomingCall(null);
	}, [socket, incomingCall]);

	const startCall = useCallback((to, name, type) => {
		if (!socket) return;
		socket.emit("call:request", { to, type });
		setActiveCall({ to, name, type, status: 'ringing', isInitiator: true });
	}, [socket]);

	const endCall = useCallback(() => {
		if (!socket || (!activeCall && !incomingCall)) return;
		const target = activeCall?.to || incomingCall?.from;
		if (target) {
			socket.emit("call:end", { to: target });
		}
		setActiveCall(null);
		setIncomingCall(null);
	}, [socket, activeCall, incomingCall]);

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
