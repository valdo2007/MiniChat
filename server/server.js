
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);



// Stockage des utilisateurs connectés
const users = new Map();

// Servir les fichiers du dossier client
app.use(express.static(path.join(__dirname, "../client")));

// Route principale
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

// Gestion des connexions Socket.IO
io.on("connection", (socket) => {
    console.log("Un client vient de se connecter :", socket.id);

    // Un utilisateur rejoint le chat
    socket.on("join-chat", (username) => {
        const cleanUsername = String(username).trim().slice(0, 20);

        if (!cleanUsername) {
            return;
        }

        users.set(socket.id, cleanUsername);

        // Confirmation au client
        socket.emit("join-success", cleanUsername);

        // Informer les autres utilisateurs
        socket.broadcast.emit("user-joined", cleanUsername);

        // Mettre à jour la liste des utilisateurs
        io.emit("users-list", Array.from(users.values()));

        console.log(cleanUsername, "a rejoint le chat");
    });

    // Réception d'un message
    socket.on("send-message", (message) => {
        const username = users.get(socket.id);

        if (!username || typeof message !== "string") {
            return;
        }

        const cleanMessage = message.trim().slice(0, 1000);

        if (!cleanMessage) {
            return;
        }

        // Préparer les données du message
        const messageData = {
            username: username,
            message: cleanMessage,
            time: new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit"
            }),
            socketId: socket.id
        };

        // Envoyer le message à tous les utilisateurs
        io.emit("new-message", messageData);
    });

    // Déconnexion d'un utilisateur
    socket.on("disconnect", () => {
        const username = users.get(socket.id);

        if (username) {
            users.delete(socket.id);

            // Informer les autres utilisateurs
            io.emit("user-left", username);

            // Actualiser la liste des participants
            io.emit("users-list", Array.from(users.values()));

            console.log(username, "a quitté le chat");
        }

        console.log("Client déconnecté :", socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
