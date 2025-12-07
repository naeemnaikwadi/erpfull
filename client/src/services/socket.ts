let socket = null;

// Only connect socket in development
if (process.env.NODE_ENV === "development") {
  // Lazy import so it does NOT load in production build
  import("socket.io-client").then(({ io }) => {
    socket = io("http://localhost:4000");
  });
}

export default socket;
