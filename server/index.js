import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
import connectMongo from "connect-mongo";
import * as dotenv from "dotenv";
import questionRoutes from "./Routes/questionRoutes.js";
import coderoutes from "./Routes/judgeRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Session setup
const MongoStore = new connectMongo(session);
const sessionMiddleware = session({
  secret: "hello", // Replace with a strong secret
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URL, // Use mongoUrl instead of mongooseConnection
  }),
  cookie: { secure: false }, // Set to true if using HTTPS
});

app.use(sessionMiddleware);

// Set up server and Socket.io with CORS
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your frontend URL
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
const PORT = process.env.PORT || 5000;

// Make sure to use the same session middleware for Socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

let queue = []; // This will hold the users waiting in the queue
let activeRooms = {}; // Track active rooms and their users

io.on("connection", (socket) => {
  const sessionID = socket.request.sessionID;
  console.log("A user connected: " + socket.id, "Session ID:", sessionID);

  // Listen for users joining the queue
  socket.on("joinQueue", () => {
    if (activeRooms[socket.id]) {
      console.log(`User ${socket.id} is already in a match.`);
      return;
    }

    if (!queue.find((user) => user.id === socket.id)) {
      console.log(`User ${socket.id} joined the queue.`);
      queue.push(socket);

      if (queue.length >= 2) {
        const user1 = queue.shift();
        const user2 = queue.shift();
        const roomId = `room_${user1.id}_${user2.id}`;

        user1.join(roomId);
        user2.join(roomId);

        activeRooms[user1.id] = roomId;
        activeRooms[user2.id] = roomId;

        user1.emit("matchFound", { roomId, opponentId: user2.id });
        user2.emit("matchFound", { roomId, opponentId: user1.id });

        console.log(`Matched user ${user1.id} with user ${user2.id} in room: ${roomId}`);
      }
    } else {
      console.log(`User ${socket.id} is already in the queue.`);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
    queue = queue.filter((user) => user.id !== socket.id);
    delete activeRooms[socket.id];
  });
});

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("DB Connected"))
  .catch((error) => console.error("Connection error:", error));

server.listen(PORT, () => {
  console.log(`Server has started on http://localhost:${PORT}`);
});

// Middleware to log the session ID for each request
app.use((req, res, next) => {
  console.log("Session ID:", req.sessionID);
  next();
});

app.use("/api", questionRoutes);
app.use("/api", coderoutes);

export const getactiveRoom = () => activeRooms;
