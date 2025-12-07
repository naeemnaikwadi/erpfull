let socket = null;

if (process.env.NODE_ENV === "development") {
  const { io } = require("socket.io-client");
  socket = io("http://localhost:4000");
}

export default socket;
