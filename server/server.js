require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const Message = require("./models/Message");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const users = new Set();

io.on("connection", async (socket) => {

  console.log("User Connected:", socket.id);

  // Send Old Messages
  try {

    const oldMessages =
      await Message.find().sort({
        createdAt: 1,
      });

    socket.emit(
      "chat_history",
      oldMessages
    );

  } catch (error) {
    console.log(error);
  }

  // Join Notification
  socket.on("user_joined", (username) => {

    socket.username = username;

    socket.broadcast.emit(
      "notification",
      `${username} joined the chat`
    );
  });

  // Online Users
  users.add(socket.id);

  io.emit(
    "online_users",
    users.size
  );

  // Send Message
  socket.on(
    "send_message",
    async (data) => {

      try {

        const newMessage =
          new Message({
            sender: data.sender,
            text: data.text,
            time: data.time,
            seen: false,
          });

        const savedMessage =
          await newMessage.save();

        io.emit(
          "receive_message",
          savedMessage
        );

      } catch (error) {
        console.log(error);
      }
    }
  );

  // Typing Indicator
  socket.on(
    "typing",
    (username) => {

      socket.broadcast.emit(
        "show_typing",
        username
      );
    }
  );

  socket.on(
    "stop_typing",
    () => {

      socket.broadcast.emit(
        "hide_typing"
      );
    }
  );

  // Seen Message
  socket.on(
    "message_seen",
    async (id) => {

      try {

        await Message.findByIdAndUpdate(
          id,
          {
            seen: true,
          }
        );

        io.emit(
          "message_seen_update",
          id
        );

      } catch (error) {
        console.log(error);
      }
    }
  );

  // Disconnect
  socket.on("disconnect", () => {

    console.log(
      "User Disconnected:",
      socket.id
    );

    if (socket.username) {

      socket.broadcast.emit(
        "notification",
        `${socket.username} left the chat`
      );
    }

    users.delete(socket.id);

    io.emit(
      "online_users",
      users.size
    );
  });

});

server.listen(3001, () => {

  console.log(
    "Server running on port 3001"
  );

});