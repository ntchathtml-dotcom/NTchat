const socket = io();

// 要素取得
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const loginBtn = document.getElementById("loginBtn");
const chatUI = document.getElementById("chatUI");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const notifySound = document.getElementById("notifySound");

// ローカルストレージからユーザー名復元
let myName = localStorage.getItem("username");
if (myName) startChat(myName);

loginBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (name) {
    localStorage.setItem("username", name);
    startChat(name);
  }
});

function startChat(name) {
  myName = name;
  socket.emit("join", { username: name });
  loginForm.style.display = "none";
  chatUI.style.display = "block";
}

// 過去ログ表示
socket.on("history", (msgs) => {
  msgs.forEach(displayMessage);
});

// メッセージ受信
socket.on("message", (msg) => {
  displayMessage(msg);
  if (msg.sender !== myName) notifySound.play();
});

// 既読更新受信
socket.on("update-read", ({ messageId, readBy }) => {
  const el = document.getElementById(messageId);
  if (el) el.querySelector(".read-status").textContent = `既読: ${readBy.join(", ")}`;
});

// メッセージ送信
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit("message", text);
  messageInput.value = "";
}

// メッセージ表示関数
function displayMessage(msg) {
  let el = document.getElementById(msg.id);
  if (!el) {
    el = document.createElement("div");
    el.id = msg.id;
    el.className = "message " + (msg.sender === myName ? "me" : "other");
    el.innerHTML = `
      <strong>${msg.sender}</strong> 
      <span class="timestamp">${msg.timestamp}</span><br>
      ${msg.text}
      <div class="read-status">既読: ${msg.readBy.join(", ")}</div>
    `;
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // 既読報告
  if (msg.sender !== myName) {
    socket.emit("message-read", { messageId: msg.id });
  }
}
