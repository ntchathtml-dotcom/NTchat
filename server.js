const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let messages = []; // メッセージ履歴

io.on("connection", (socket) => {
  console.log("ユーザー接続");

  // ログインしたユーザー名をソケットに保存
  socket.on("join", ({ username }) => {
    socket.username = username;
    // 過去メッセージを送る
    socket.emit("history", messages);
  });

  // メッセージ受信
  socket.on("message", (text) => {
    const msg = {
      id: Date.now().toString(),
      sender: socket.username,
      text,
      timestamp: new Date().toLocaleTimeString(),
      readBy: []
    };
    messages.push(msg);
    io.emit("message", msg);
  });

  // 既読更新
  socket.on("message-read", ({ messageId }) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg && !msg.readBy.includes(socket.username)) {
      msg.readBy.push(socket.username);
      io.emit("update-read", { messageId, readBy: msg.readBy });
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
