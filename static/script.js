document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Script loaded"); // Debugging

    // ✅ DOM Elements
    const chatbox = document.getElementById("chat-messages");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const saveChatBtn = document.getElementById("save-chat-btn");
    const loadChatBtn = document.getElementById("load-chat-btn");
    const newChatBtn = document.getElementById("new-chat-btn");
    const settingsBtn = document.getElementById("settings-btn");
    const settingsBox = document.getElementById("settings-box");
    const sidebar = document.getElementById("sidebar");
    const closeSidebar = document.getElementById("close-sidebar");
    const savedChatsDiv = document.getElementById("saved-chats");
    const modelSelect = document.getElementById("model-select");
    const scrollButton = document.getElementById("scroll-button");

    if (!chatbox || !userInput || !sendBtn) {
        console.error("❌ One or more elements not found! Check IDs in HTML.");
        return;
    }

    let currentChat = [];
    let savedChats = JSON.parse(localStorage.getItem("savedChats")) || [];

    /** ✅ Function to Add Messages in Speech Bubbles */
    function addMessage(text, sender, animated = false) {
        if (!text) return;
        
        console.log(`📩 Adding message: ${text} (${sender})`); // Debugging

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);

        if (animated) {
            let i = 0;
            function typeLetter() {
                if (i < text.length) {
                    messageDiv.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(typeLetter, 30);
                }
            }
            typeLetter();
        } else {
            messageDiv.innerText = text;
        }

        chatbox.appendChild(messageDiv);
        scrollToBottom();
    }

    /** ✅ Typing Animation */
    function showTypingAnimation() {
        console.log("⏳ Showing typing animation..."); // Debugging

        const typingDiv = document.createElement("div");
        typingDiv.classList.add("message", "ai-message", "typing");
        typingDiv.innerHTML = "<span></span><span></span><span></span>";
        chatbox.appendChild(typingDiv);
        scrollToBottom();
        return typingDiv;
    }

    /** ✅ Send Message & Get AI Response */
    function sendMessage() {
        console.log("📨 Sending message..."); // Debugging

        const text = userInput.value.trim();
        if (!text) {
            console.warn("⚠️ Empty message! Ignoring...");
            return;
        }

        addMessage(text, "user-message");
        currentChat.push({ role: "user", content: text });

        const typingDiv = showTypingAnimation();
        const selectedModel = modelSelect.value;

        fetch("/chat", {
            method: "POST",
            body: JSON.stringify({ message: text, model: selectedModel }),
            headers: { "Content-Type": "application/json" }
        })
        .then(response => response.json())
        .then(data => {
            chatbox.removeChild(typingDiv);

            const aiResponse = data.response?.trim();
            if (aiResponse) {
                addMessage(aiResponse, "ai-message", true);
                currentChat.push({ role: "ai", content: aiResponse });
            } else {
                addMessage("I'm sorry, I didn't understand that.", "ai-message", true);
            }
        })
        .catch(error => {
            console.error("❌ Fetch error:", error);
            chatbox.removeChild(typingDiv);
            addMessage("Error: Unable to get a response.", "ai-message");
        });

        userInput.value = "";
    }

    /** ✅ Attach Event Listeners */
    sendBtn.addEventListener("click", function () {
        console.log("🖱️ Send button clicked!");
        sendMessage();
    });

    userInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            console.log("⌨️ Enter key pressed!");
            e.preventDefault(); // Prevents unintended form submission
            sendMessage();
        }
    });

    /** ✅ Save Chat */
    saveChatBtn.addEventListener("click", function () {
        if (currentChat.length === 0) return;

        const chatString = JSON.stringify(currentChat);
        if (!savedChats.some(chat => JSON.stringify(chat) === chatString)) {
            savedChats.push(currentChat);
            localStorage.setItem("savedChats", JSON.stringify(savedChats));
        }
        alert("💾 Chat saved!");
    });

    /** ✅ Load Chats */
    loadChatBtn.addEventListener("click", function () {
        sidebar.classList.add("show");
        savedChatsDiv.innerHTML = "";

        savedChats.forEach((chat, index) => {
            const chatItem = document.createElement("div");
            chatItem.classList.add("chat-item");
            chatItem.innerText = `Chat ${index + 1}`;

            chatItem.addEventListener("click", function () {
                chatbox.innerHTML = "";
                currentChat = chat;
                chat.forEach(msg => addMessage(msg.content, msg.role === "user" ? "user-message" : "ai-message"));
            });

            savedChatsDiv.appendChild(chatItem);
        });
    });

    /** ✅ Close Sidebar */
    closeSidebar.addEventListener("click", function () {
        sidebar.classList.remove("show");
    });

    /** ✅ Start a New Chat */
    newChatBtn.addEventListener("click", function () {
        if (currentChat.length > 0 && !confirm("Start a new chat? Unsaved messages will be lost.")) return;
        chatbox.innerHTML = "";
        currentChat = [];
    });

    /** ✅ Toggle Settings */
    settingsBtn.addEventListener("click", function () {
        settingsBox.style.display = settingsBox.style.display === "none" ? "block" : "none";
    });

    /** ✅ Auto-Scroll to Bottom */
    function scrollToBottom() {
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    /** ✅ Detect Scrolling to Show Scroll Button */
    chatbox.addEventListener("scroll", function () {
        if (chatbox.scrollTop < chatbox.scrollHeight - chatbox.clientHeight - 100) {
            scrollButton.style.display = "block";
        } else {
            scrollButton.style.display = "none";
        }
    });

    /** ✅ Scroll to Bottom when Button Clicked */
    scrollButton.addEventListener("click", function () {
        chatbox.scrollTop = chatbox.scrollHeight;
    });

    /** ✅ Observe for New Messages */
    const observer = new MutationObserver(scrollToBottom);
    observer.observe(chatbox, { childList: true });

    console.log("✅ Script setup complete!");
});
