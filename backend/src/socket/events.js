export const SOCKET_EVENTS = {
  JOIN_SESSION: "session:join",
  SEND_MESSAGE: "chat:send",
  NEW_MESSAGE: "chat:new",
  ERROR: "error",

  // Video call / WebRTC signaling
  VIDEO_OFFER: "video:offer",
  VIDEO_ANSWER: "video:answer",
  VIDEO_ICE: "video:ice",
  VIDEO_END: "video:end"
};
