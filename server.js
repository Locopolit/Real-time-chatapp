const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(__dirname + '/public'));

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
    console.log('New user connected');

    // When a new user joins
    socket.on('join', (username) => {
        users.set(socket.id, username);
        io.emit('user joined', { username, users: [...users.values()] });
    });

    // When a message is sent
    socket.on('chat message', (msg) => {
        const username = users.get(socket.id) || 'Anonymous';
        io.emit('chat message', { username, message: msg });
    });

    // When someone is typing
    socket.on('typing', () => {
        const username = users.get(socket.id) || 'Someone';
        socket.broadcast.emit('user typing', username);
    });

    // When user disconnects
    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (username) {
            users.delete(socket.id);
            io.emit('user left', { username, users: [...users.values()] });
        }
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
