export function notificationSocket(io) {
  io.on("connection", (socket) => {
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }
  });
}
