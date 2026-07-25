import { useEffect, useRef, useState, useCallback } from "react";
import { FiVideo, FiPhone, FiMic, FiMicOff, FiCamera, FiCameraOff } from "react-icons/fi";
import { Button } from "../ui";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" }
];

const SOCKET_EVENTS = {
  VIDEO_OFFER: "video:offer",
  VIDEO_ANSWER: "video:answer",
  VIDEO_ICE: "video:ice",
  VIDEO_END: "video:end",
  ERROR: "error"
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VideoCall({ sessionId, socket, durationMinutes, onEnd, otherUserName = "Other party" }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const isMutedRef = useRef(false);
  const isVideoOffRef = useRef(false);

  const [status, setStatus] = useState("idle"); // idle | connecting | connected | ended
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  const durationSeconds = Math.max(1, (durationMinutes || 30) * 60);
  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);

  const cleanup = useCallback(() => {
    timerStartedRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setStatus("ended");
  }, []);

  const endCall = useCallback(() => {
    if (socket && sessionId) socket.emit(SOCKET_EVENTS.VIDEO_END, { sessionId });
    cleanup();
    onEnd?.();
  }, [socket, sessionId, cleanup, onEnd]);

  // Time-limited countdown - start once when call begins
  useEffect(() => {
    if (status !== "connected" && status !== "connecting") return;
    if (timerStartedRef.current) return;
    timerStartedRef.current = true;
    setTimeLeft(durationSeconds);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev == null) return durationSeconds - 1;
        if (prev <= 1) {
          endCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, durationSeconds, endCall]);

  const startCall = useCallback(async () => {
    if (!socket || !sessionId) return;
    setError(null);
    setHasRemoteStream(false);
    setStatus("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
          setHasRemoteStream(true);
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit(SOCKET_EVENTS.VIDEO_ICE, { sessionId, candidate: e.candidate });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("connected");
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          endCall();
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit(SOCKET_EVENTS.VIDEO_OFFER, { sessionId, offer });
      setTimeLeft(durationSeconds);
    } catch (err) {
      setError(err.message || "Could not access camera/microphone");
      setStatus("idle");
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    }
  }, [socket, sessionId, durationSeconds, endCall]);

  // Handle incoming offer
  useEffect(() => {
    if (!socket || !sessionId || status === "ended") return;

    const handleOffer = async ({ sessionId: sid, offer: of }) => {
      if (sid !== sessionId) return;
      if (pcRef.current) return;

      setError(null);
      setHasRemoteStream(false);
      setStatus("connecting");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (e) => {
          if (remoteVideoRef.current && e.streams[0]) {
            remoteVideoRef.current.srcObject = e.streams[0];
            setHasRemoteStream(true);
          }
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit(SOCKET_EVENTS.VIDEO_ICE, { sessionId: sid, candidate: e.candidate });
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") setStatus("connected");
          if (["failed", "disconnected", "closed"].includes(pc.connectionState)) endCall();
        };

        await pc.setRemoteDescription(new RTCSessionDescription(of));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit(SOCKET_EVENTS.VIDEO_ANSWER, { sessionId: sid, answer });
        setTimeLeft(durationSeconds);
      } catch (err) {
        setError(err.message || "Could not join call");
        setStatus("idle");
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
        }
      }
    };

    const handleAnswer = async ({ sessionId: sid, answer, from }) => {
      if (sid !== sessionId) return;
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (e) {
        console.error("Set remote description failed:", e);
      }
    };

    const handleIce = async ({ sessionId: sid, candidate, from }) => {
      if (sid !== sessionId) return;
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Add ICE candidate failed:", e);
      }
    };

    const handleEnd = ({ sessionId: sid }) => {
      if (sid === sessionId) endCall();
    };

    const handleErr = ({ message }) => setError(message);

    socket.on(SOCKET_EVENTS.VIDEO_OFFER, handleOffer);
    socket.on(SOCKET_EVENTS.VIDEO_ANSWER, handleAnswer);
    socket.on(SOCKET_EVENTS.VIDEO_ICE, handleIce);
    socket.on(SOCKET_EVENTS.VIDEO_END, handleEnd);
    socket.on(SOCKET_EVENTS.ERROR, handleErr);

    return () => {
      socket.off(SOCKET_EVENTS.VIDEO_OFFER, handleOffer);
      socket.off(SOCKET_EVENTS.VIDEO_ANSWER, handleAnswer);
      socket.off(SOCKET_EVENTS.VIDEO_ICE, handleIce);
      socket.off(SOCKET_EVENTS.VIDEO_END, handleEnd);
      socket.off(SOCKET_EVENTS.ERROR, handleErr);
    };
  }, [socket, sessionId, status, durationSeconds, endCall]);

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audio = localStreamRef.current.getAudioTracks()[0];
    if (audio) {
      audio.enabled = !audio.enabled;
      isMutedRef.current = !audio.enabled;
      setMuted(!audio.enabled);
    }
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const video = localStreamRef.current.getVideoTracks()[0];
    if (video) {
      video.enabled = !video.enabled;
      isVideoOffRef.current = !video.enabled;
      setVideoOff(!video.enabled);
    }
  };

  if (status === "ended") {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 ring-2 ring-border">
            <FiVideo className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">Call ended</h3>
          <p className="text-text-secondary text-sm mb-6">The video consultation has concluded.</p>
          <Button variant="secondary" onClick={onEnd}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-10 px-6">
          <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mb-5 ring-4 ring-primary-light">
            <FiVideo className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">Video consultation</h3>
          <p className="text-text-secondary text-sm text-center mb-6">
            Start a time-limited video call with your lawyer. Duration: {durationMinutes} minutes.
          </p>
          {error && (
            <p className="text-danger text-sm mb-4 px-4 py-2 rounded-lg bg-danger-light w-full max-w-sm text-center">
              {error}
            </p>
          )}
          <Button onClick={startCall} className="gap-2">
            <FiPhone className="w-4 h-4" />
            Start video call
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-neutral-900">
        <div className="relative rounded-xl overflow-hidden bg-neutral-950 aspect-video ring-1 ring-white/10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <span className="absolute bottom-2 left-2 text-xs font-medium text-white/95 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md">
            You
          </span>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-neutral-950 aspect-video ring-1 ring-white/10">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${!hasRemoteStream ? "bg-neutral-900/90" : "bg-transparent pointer-events-none"}`}>
            {status === "connecting" && !hasRemoteStream && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-primary-border border-t-primary rounded-full animate-spin" />
                <span className="text-sm text-white/80">Connecting to {otherUserName}...</span>
              </div>
            )}
          </div>
          <span className="absolute bottom-2 left-2 text-xs font-medium text-white/95 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md z-10">
            {otherUserName}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-surface border-t border-border">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hover border border-border">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Time left</span>
          <span className="text-base font-mono font-semibold text-text-primary tabular-nums">
            {timeLeft != null ? formatTime(timeLeft) : "--:--"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className={`flex items-center justify-center w-11 h-11 rounded-full transition-all ${
              muted ? "bg-danger-light text-danger hover:bg-danger-light-hover" : "bg-surface-hover text-text-primary hover:bg-border border border-border"
            }`}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={toggleVideo}
            className={`flex items-center justify-center w-11 h-11 rounded-full transition-all ${
              videoOff ? "bg-danger-light text-danger hover:bg-danger-light-hover" : "bg-surface-hover text-text-primary hover:bg-border border border-border"
            }`}
            title={videoOff ? "Turn camera on" : "Turn camera off"}
          >
            {videoOff ? <FiCameraOff className="w-5 h-5" /> : <FiCamera className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={endCall}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-danger text-danger-text hover:bg-danger-hover transition-all ml-1"
            title="End call"
          >
            <FiPhone className="w-5 h-5 rotate-[135deg]" />
          </button>
        </div>
      </div>
    </div>
  );
}
