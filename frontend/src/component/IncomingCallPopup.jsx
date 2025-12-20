import { useCall } from "../context/IncomingCallContext.jsx";

export default function IncomingCallPopup() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  return (
    <div className="popup">
      <h4>{incomingCall.name} is calling you ({incomingCall.type})</h4>
      <button onClick={acceptCall}>Accept</button>
      <button onClick={rejectCall}>Reject</button>
    </div>
  );
}
