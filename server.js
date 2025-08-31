const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname)); // index.htmlなどを配信

const messages = []; // メッセージ保存

io.on("connection", (socket) => {

  // --- ログイン ---
  socket.on("join", ({ username }) => {
    socket.username = username;
    console.log(username + " が参加しました");
    // 接続時に過去メッセージを送信
    messages.forEach(msg => socket.emit("message", msg));
  });

  // --- メッセージ送信 ---
  socket.on("message", ({ text }) => {
    const msg = {
      id: uuidv4(),
      sender: socket.username,
      text,
      timestamp: new Date().toISOString(),
      readBy: []
    };
    messages.push(msg);
    io.emit("message", msg);
  });

  // --- 既読処理 ---
  socket.on("message-read", ({ messageId, user }) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg && !msg.readBy.includes(user)) {
      msg.readBy.push(user);
      io.emit("update-read", { messageId, readBy: msg.readBy });
    }
  });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
