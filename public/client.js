const socket = io();

// --- ログイン処理 ---
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");
const loginForm = document.getElementById("loginForm");
const chatUI = document.getElementById("chatUI");

let myName = localStorage.getItem("username");
if (myName) startChat(myName);

loginBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("名前を入力してください");
  localStorage.setItem("username", name);
  startChat(name);
});

function startChat(name) {
  myName = name;
  socket.emit("join", { username: name });
  loginForm.style.display = "none";
  chatUI.style.display = "block";
}

// --- メッセージ送信 ---
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const messagesDiv = document.getElementById("messages");

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keypress", (e) => { if(e.key==='Enter') sendMessage(); });

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit("message", { text });
  msgInput.value = '';
}

// --- メッセージ受信 ---
socket.on("message", (msg) => {
  displayMessage(msg);
  // 既読をサーバーに通知
  socket.emit("message-read", { messageId: msg.id, user: myName });
});

socket.on("update-read", ({ messageId, readBy }) => {
  const msgElem = document.getElementById(messageId);
  if (msgElem) msgElem.querySelector(".read-status").textContent = `既読: ${readBy.join(", ")}`;
});

// --- 表示関数 ---
function displayMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";
  div.id = msg.id;
  div.innerHTML = `<strong>${msg.sender}</strong> [${new Date(msg.timestamp).toLocaleTimeString()}]: ${msg.text} <span class="read-status"></span>`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // 通知音
  if (msg.sender !== myName) {
    const audio = new Audio("notification.mp3"); // notification.mp3 を用意
    audio.play();
  }
}
