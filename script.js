document.addEventListener("DOMContentLoaded", function () {
    const chatbox = document.getElementById("chatbox");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const savedChats = document.getElementById("saved-chats");
    const newChatBtn = document.getElementById("new-chat-btn");
    const settingsBtn = document.getElementById("settings-btn");
    const settingsMenu = document.getElementById("settings-menu");
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const modelSelect = document.getElementById("model-select");
    const factoryResetBtn = document.getElementById("factory-reset-btn");

    let chatSessions = JSON.parse(localStorage.getItem("chatSessions")) || {};
    let chatCount = Object.keys(chatSessions).length;
    let currentChatId = Object.keys(chatSessions)[0] || createNewChat(true);
    let isProcessing = false; // Prevent multiple messages at once

    function saveCurrentChat() {
        if (currentChatId && chatSessions[currentChatId]) {
            chatSessions[currentChatId].messages = Array.from(chatbox.children).map(msg => ({
                sender: msg.classList.contains("user-message") ? "You" : "AI",
                message: msg.textContent
            }));
            localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
        }
    }

    function loadSavedChats() {
        savedChats.innerHTML = "";
        Object.keys(chatSessions).forEach(chatId => {
            const chatItem = document.createElement("div");
            chatItem.classList.add("chat-item");

            const chatName = document.createElement("span");
            chatName.textContent = chatSessions[chatId].name;
            chatName.dataset.chatId = chatId;
            chatName.addEventListener("click", function () {
                saveCurrentChat();
                loadChat(chatId);
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑️";
            deleteBtn.classList.add("delete-btn");
            deleteBtn.addEventListener("click", function (event) {
                event.stopPropagation();
                deleteChat(chatId);
            });

            chatItem.appendChild(chatName);
            chatItem.appendChild(deleteBtn);
            savedChats.appendChild(chatItem);
        });
    }

    function deleteChat(chatId) {
        if (confirm("Are you sure you want to delete this chat?")) {
            delete chatSessions[chatId];
            localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
            loadSavedChats();
            if (currentChatId === chatId) {
                chatbox.innerHTML = "";
                currentChatId = Object.keys(chatSessions)[0] || createNewChat(true);
                if (currentChatId) loadChat(currentChatId);
            }
        }
    }

    function factoryReset() {
        if (confirm("This will delete ALL chats. Are you sure?")) {
            localStorage.removeItem("chatSessions");
            chatSessions = {};
            chatCount = 0;
            chatbox.innerHTML = "";
            createNewChat();
            loadSavedChats();
        }
    }

    function appendMessage(sender, message, animate = false) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender === "You" ? "user-message" : "ai-message");
        chatbox.appendChild(messageDiv);

        if (animate) {
            let i = 0;
            function typeLetter() {
                if (i < message.length) {
                    messageDiv.textContent += message.charAt(i);
                    i++;
                    setTimeout(typeLetter, 30);
                }
            }
            typeLetter();
        } else {
            messageDiv.textContent = message;
        }

        chatbox.scrollTop = chatbox.scrollHeight;
    }

    function loadChat(chatId) {
        if (!chatSessions[chatId]) return;

        currentChatId = chatId;
        chatbox.innerHTML = "";

        chatSessions[chatId].messages.forEach(entry => {
            appendMessage(entry.sender, entry.message);
        });

        localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
    }

    function createNewChat(isFirst = false) {
        saveCurrentChat();

        chatCount++;
        const chatId = Date.now().toString();
        chatSessions[chatId] = {
            name: `Chat ${chatCount}`,
            messages: []
        };
        currentChatId = chatId;

        localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
        loadSavedChats();

        chatbox.innerHTML = "";
        return chatId;
    }

    sendBtn.addEventListener("click", function () {
        if (isProcessing) return; // Stop multiple messages at once
        isProcessing = true; // Lock input

        const message = userInput.value.trim();
        if (message === "") return;

        appendMessage("You", message);
        userInput.value = "";
        userInput.disabled = true; // Disable input
        sendBtn.disabled = true; // Disable send button

        appendMessage("AI", "Typing...", false);

        fetch("/chat", {
            method: "POST",
            body: JSON.stringify({ message }),
            headers: { "Content-Type": "application/json" }
        })
        .then(response => response.json())
        .then(data => {
            chatbox.lastChild.remove();
            appendMessage("AI", data.response, true);
        })
        .catch(error => {
            console.error("Error:", error);
            chatbox.lastChild.remove();
            appendMessage("AI", "Error: Could not connect to the server.");
        })
        .finally(() => {
            isProcessing = false; // Unlock input
            userInput.disabled = false; // Enable input
            sendBtn.disabled = false; // Enable button
            userInput.focus(); // Focus input again
        });
    });

    newChatBtn.addEventListener("click", function () {
        createNewChat();
        chatbox.innerHTML = "";
    });

    userInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendBtn.click();
    });

    factoryResetBtn.addEventListener("click", factoryReset);

    // Dark Mode Toggle
    darkModeToggle.addEventListener("change", function () {
        if (darkModeToggle.checked) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("darkMode", "enabled");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("darkMode", "disabled");
        }
    });

    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
        darkModeToggle.checked = true;
    }

    // Settings Button Toggle
    settingsBtn.addEventListener("click", function () {
        settingsMenu.classList.toggle("visible");
    });

    loadSavedChats();
    if (currentChatId) loadChat(currentChatId);
});
