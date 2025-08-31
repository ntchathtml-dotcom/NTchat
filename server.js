const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const MESSAGES_FILE = path.join(__dirname, "messages.json");

// 永続化メッセージ読み込み
let messages = [];
if (fs.existsSync(MESSAGES_FILE)) {
  try {
    messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
  } catch(e) {
    console.error("messages.json の読み込みエラー", e);
    messages = [];
  }
}

// --- ユーザー接続 ---
io.on("connection", (socket) => {

  // ログイン
  socket.on("join", ({ username }) => {
    socket.username = username;
    console.log(username + " が参加しました");

    // 過去メッセージを送信
    messages.forEach(msg => socket.emit("message", msg));
  });

  // メッセージ送信
  socket.on("message", ({ text }) => {
    const msg = {
      id: uuidv4(),
      sender: socket.username,
      text,
      timestamp: new Date().toISOString(),
      readBy: []
    };
    messages.push(msg);

    // 永続化
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

    io.emit("message", msg);
  });

  // 既読処理
  socket.on("message-read", ({ messageId, user }) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg && !msg.readBy.includes(user)) {
      msg.readBy.push(user);
      io.emit("update-read", { messageId, readBy: msg.readBy });

      // 永続化更新
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    }
  });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
