document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Script loaded");

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
        console.error("❌ Missing important elements. Check HTML IDs.");
        return;
    }

    let currentChat = [];
    let savedChats = JSON.parse(localStorage.getItem("savedChats")) || [];

    /** ✅ Disable and Enable Input */
    function disableInput() {
        userInput.disabled = true;
        sendBtn.disabled = true;
    }

    function enableInput() {
        userInput.disabled = false;
        sendBtn.disabled = false;
    }

  /** ✅ Add Messages with Markdown Support (Prevent Bubble Resizing) */
function addMessage(text, sender, animated = false) {
    if (!text) return;

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);

    // ✅ Render GIF if triggered
    if (sender === "ai-message" && text.toLowerCase().includes("reaction gif")) {
        const gifImg = document.createElement("img");
        gifImg.src = "/static/giphy.gif";
        gifImg.alt = "Reaction GIF";
        gifImg.style.width = "200px";
        messageDiv.appendChild(gifImg);
    } else {
        // ✅ Render Markdown using marked.js
        const renderedText = marked.parse(text);
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = renderedText;
        const plainText = tempDiv.textContent || tempDiv.innerText;

        if (animated) {
            // ✅ Apply Temporary Fixed Height to Prevent Resizing
            messageDiv.style.minHeight = "50px"; // Adjust based on expected height
            messageDiv.style.overflow = "hidden";

            let i = 0;
            let tempText = "";

            function typeLetter() {
                if (i < plainText.length) {
                    tempText += plainText.charAt(i);
                    messageDiv.innerHTML = tempText.replace(/\n/g, "<br>"); // Ensuring new lines are visible
                    i++;
                    setTimeout(typeLetter, 30);
                } else {
                    // ✅ Apply Final Markdown with Proper Sizing
                    messageDiv.style.minHeight = "unset";
                    messageDiv.style.overflow = "visible";
                    messageDiv.innerHTML = renderedText;
                }
            }
            typeLetter();
        } else {
            messageDiv.innerHTML = renderedText;
        }
    }

    chatbox.appendChild(messageDiv);
    scrollToBottom();
}



    /** ✅ Typing Animation */
    function showTypingAnimation() {
        const typingDiv = document.createElement("div");
        typingDiv.classList.add("message", "ai-message", "typing");
        typingDiv.innerHTML = "<span></span><span></span><span></span>";
        chatbox.appendChild(typingDiv);
        scrollToBottom();
        return typingDiv;
    }

    /** ✅ Send Message & Get AI Response */
    function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, "user-message");
        currentChat.push({ role: "user", content: text });

        // ✅ Trigger GIF if asked
        if (/(give me the answer|tell me the answer|just give me the answer)/i.test(text)) {
            addMessage("reaction gif", "ai-message");
            enableInput();
            userInput.value = "";
            return;
        }

        disableInput();
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
            const aiResponse = data.response?.trim() || "I'm sorry, I didn't understand that.";
            addMessage(aiResponse, "ai-message", true);
            currentChat.push({ role: "ai", content: aiResponse });
            enableInput();
        })
        .catch(error => {
            console.error("❌ Error:", error);
            chatbox.removeChild(typingDiv);
            addMessage("Error: Unable to get a response.", "ai-message");
            enableInput();
        });

        userInput.value = "";
    }

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

            // Delete Chat Button
            const deleteBtn = document.createElement("button");
            deleteBtn.innerText = "❌";
            deleteBtn.onclick = function () {
                if (confirm("Are you sure you want to delete this chat?")) {
                    savedChats.splice(index, 1);
                    localStorage.setItem("savedChats", JSON.stringify(savedChats));
                    chatItem.remove();
                }
            };
            chatItem.appendChild(deleteBtn);
            savedChatsDiv.appendChild(chatItem);
        });
    });

    /** ✅ Close Sidebar */
    closeSidebar.addEventListener("click", function () {
        sidebar.classList.remove("show");
    });

    /** ✅ New Chat */
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
        scrollButton.style.display = (chatbox.scrollTop < chatbox.scrollHeight - chatbox.clientHeight - 100) ? "block" : "none";
    });

    /** ✅ Scroll to Bottom when Button Clicked */
    scrollButton.addEventListener("click", scrollToBottom);

    /** ✅ Enter Key Support */
    userInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener("click", sendMessage() )

    
    /** ✅ Mutation Observer for Chat Updates */
    const observer = new MutationObserver(scrollToBottom);
    observer.observe(chatbox, { childList: true });

    console.log("✅ Final script loaded successfully!");
});
