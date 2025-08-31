document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');
    const onlineCount = document.getElementById('online-count');
    const usernameModal = document.getElementById('username-modal');
    const usernameInput = document.getElementById('username-input');
    const joinButton = document.getElementById('join-button');

    // Connect to Socket.IO server
    const socket = io();
    let username = '';
    let typingTimeout;

    // Show username modal on load
    showUsernameModal();

    // Join chat with username
    joinButton.addEventListener('click', joinChat);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinChat();
        }
    });

    function joinChat() {
        const inputUsername = usernameInput.value.trim();
        if (inputUsername) {
            username = inputUsername;
            socket.emit('join', username);
            usernameModal.classList.add('hidden');
            messageInput.focus();
        }
    }

    // Send message
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            // Emit the message to the server
            socket.emit('chat message', message);
            
            // Clear the input
            messageInput.value = '';
            
            // Clear any typing indicator
            clearTimeout(typingTimeout);
            socket.emit('stop typing');
        }
    }

    // Event listeners for sending messages
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        } else {
            // User is typing
            socket.emit('typing');
            
            // Clear previous timeout
            clearTimeout(typingTimeout);
            
            // Set a new timeout
            typingTimeout = setTimeout(() => {
                socket.emit('stop typing');
            }, 2000);
        }
    });

    // Socket event listeners
    socket.on('chat message', (data) => {
        addMessage(data.username, data.message, getCurrentTime(), data.username === username ? 'sent' : 'received');
    });

    socket.on('user typing', (username) => {
        typingIndicator.textContent = `${username} is typing...`;
    });

    socket.on('stop typing', () => {
        typingIndicator.textContent = '';
    });

    socket.on('user joined', (data) => {
        addSystemMessage(`${data.username} has joined the chat`);
        updateOnlineCount(data.users.length);
    });

    socket.on('user left', (data) => {
        addSystemMessage(`${data.username} has left the chat`);
        updateOnlineCount(data.users.length);
    });

    // Update online users count
    function updateOnlineCount(count) {
        onlineCount.textContent = `${count} Online`;
    }

    // Add a message to the chat
    function addMessage(sender, message, time, type) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        
        messageDiv.innerHTML = `
            <div class="message-username">${sender}</div>
            <div class="message-text">${message}</div>
            <div class="message-time">${time}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // Add a system message (join/leave notifications)
    function addSystemMessage(message) {
        const systemMessage = document.createElement('div');
        systemMessage.classList.add('system-message');
        systemMessage.textContent = message;
        chatMessages.appendChild(systemMessage);
        scrollToBottom();
    }

    // Show username modal
    function showUsernameModal() {
        usernameModal.classList.remove('hidden');
        usernameInput.focus();
    }

    // Get current time in HH:MM format
    function getCurrentTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    // Scroll to bottom of chat
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Initial scroll to bottom
    scrollToBottom();
});
