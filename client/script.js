
const socket = io();

// Elements HTML
const joinScreen = document.getElementById("join-screen");
const chatApp = document.getElementById("chat-app");

const joinForm = document.getElementById("join-form");
const usernameInput = document.getElementById("username-input");

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

const messagesContainer = document.getElementById("messages-container");
const usersList = document.getElementById("users-list");
const usersCount = document.getElementById("users-count");

const connectionIndicator = document.getElementById("connection-indicator");
const connectionText = document.getElementById("connection-text");

// Variables
let username = "";
let hasJoined = false;

// Connexion au serveur
socket.on("connect", () => {
    console.log("Connecté au serveur :", socket.id);

    connectionIndicator.className = "status-dot online";
    connectionText.textContent = "Connecté";

    // Rejoindre automatiquement après une reconnexion
    if (username && hasJoined) {
        socket.emit("join-chat", username);
    }
});

socket.on("disconnect", () => {
    console.log("Déconnecté du serveur");

    connectionIndicator.className = "status-dot offline";
    connectionText.textContent = "Déconnecté";
});

// Rejoindre le chat
joinForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const enteredUsername = usernameInput.value.trim();

    if (!enteredUsername) {
        return;
    }

    username = enteredUsername.slice(0, 20);

    socket.emit("join-chat", username);
});

// Confirmation de connexion au chat
socket.on("join-success", (confirmedUsername) => {
    username = confirmedUsername;
    hasJoined = true;

    joinScreen.classList.add("hidden");
    chatApp.classList.remove("hidden");

    messageInput.focus();
});

// Envoyer un message
messageForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message || !hasJoined) {
        return;
    }

    socket.emit("send-message", message);

    messageInput.value = "";
    messageInput.focus();
});

// Recevoir un message
socket.on("new-message", (data) => {
    displayMessage(data);
});

// Afficher un message dans la discussion
function displayMessage(data) {
    const welcomeMessage = messagesContainer.querySelector(".welcome-message");

    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageElement = document.createElement("div");

    const isOwnMessage = data.socketId === socket.id;

    messageElement.classList.add("message");

    if (isOwnMessage) {
        messageElement.classList.add("own");
    }

    // Informations du message
    const messageInfo = document.createElement("div");
    messageInfo.classList.add("message-info");

    const messageUsername = document.createElement("span");
    messageUsername.classList.add("message-username");
    messageUsername.textContent = isOwnMessage ? "Vous" : data.username;

    const messageTime = document.createElement("span");
    messageTime.classList.add("message-time");
    messageTime.textContent = data.time;

    messageInfo.append(messageUsername, messageTime);

    // Contenu du message
    const messageBubble = document.createElement("div");
    messageBubble.classList.add("message-bubble");
    messageBubble.textContent = data.message;

    messageElement.append(messageInfo, messageBubble);

    messagesContainer.appendChild(messageElement);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Un utilisateur rejoint
socket.on("user-joined", (joinedUsername) => {
    displaySystemMessage(`${joinedUsername} a rejoint la discussion`);
});

// Un utilisateur quitte
socket.on("user-left", (leftUsername) => {
    displaySystemMessage(`${leftUsername} a quitté la discussion`);
});

// Afficher les notifications
function displaySystemMessage(text) {
    const notification = document.createElement("div");

    notification.classList.add("system-message");
    notification.textContent = text;

    messagesContainer.appendChild(notification);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Mise à jour de la liste des utilisateurs
socket.on("users-list", (users) => {
    usersList.innerHTML = "";
    usersCount.textContent = users.length;

    users.forEach((user) => {
        const li = document.createElement("li");
        li.classList.add("user-item");

        const avatar = document.createElement("div");
        avatar.classList.add("user-avatar");
        avatar.textContent = user.charAt(0).toUpperCase();

        const name = document.createElement("span");
        name.classList.add("username");
        name.textContent = user === username ? `${user} (vous)` : user;

        const onlineDot = document.createElement("span");
        onlineDot.classList.add("user-online-dot");

        li.append(avatar, name, onlineDot);

        usersList.appendChild(li);
    });
});
