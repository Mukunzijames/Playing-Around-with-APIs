import { GoogleGenerativeAI } from "@google/generative-ai";

const businessInfo = `

General Information about Jaeve AI:
Website: www.jamess.dev

About Jaeve AI:
Jaeve AI is an advanced artificial intelligence assistant designed to help with a wide range of tasks including answering questions, providing project insights, and offering personalized assistance.

Key Features:
- Smart project analysis and recommendations
- Natural language understanding and processing
- Personalized responses based on user history
- Real-time information and updates
- Multi-context conversations

Usage Guidelines:
Jaeve AI can help with:
- Project status and performance analysis
- Technical questions about programming and development
- Planning and organization assistance
- General information and knowledge queries
- Creative suggestions and problem-solving

Privacy Policy:
User conversations are saved to provide continuity and improve responses.
All data is stored securely and not shared with third parties.
Users can delete their conversation history at any time.

Support:
For technical support or questions about Jaeve AI, please contact support@jaeveai.com

FAQs:

What can Jaeve AI do?
Jaeve AI can answer questions, analyze project performance, provide technical assistance, and help with planning and organization.

How does Jaeve AI remember my conversations?
Jaeve AI saves conversation history in your browser's local storage to provide continuity and context-aware responses.

Is my data secure with Jaeve AI?
Yes, your conversations are stored locally in your browser and not shared with third parties.

Can Jaeve AI help with technical coding questions?
Yes, Jaeve AI is knowledgeable about various programming languages, frameworks, and development practices.

How accurate is Jaeve AI's project analysis?
Jaeve AI provides insights based on the information you share. For the most accurate analysis, provide clear details about your projects.

Tone Instructions:
Friendliness: Maintain a helpful and supportive tone.
Clarity: Provide clear and concise explanations.
Personalization: Reference previous conversations when relevant.
Expertise: Demonstrate knowledge while remaining accessible.
Encouragement: Offer positive reinforcement and constructive feedback.
Example: "I'm happy to help with your project! Based on what you've shared, here are some suggestions..."

`;



const API_KEY = "AIzaSyAGpxg2bcM1RtYO8cc94crAsEW0M6-X9D8";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    systemInstruction: businessInfo
});

let currentConversationId = null;
let conversations = {};

// Initialize conversations from localStorage
function initConversations() {
    // Load conversations from localStorage
    const savedConversations = localStorage.getItem('jaeveAIConversations');
    if (savedConversations) {
        conversations = JSON.parse(savedConversations);
        
        // Load the conversation list into sidebar
        updateConversationList();
        
        // Load latest conversation if exists
        const lastConversationId = localStorage.getItem('jaeveAILastConversation');
        if (lastConversationId && conversations[lastConversationId]) {
            loadConversation(lastConversationId);
        } else if (Object.keys(conversations).length > 0) {
            // Load the most recent conversation
            const mostRecentId = Object.keys(conversations).sort((a, b) => {
                return conversations[b].timestamp - conversations[a].timestamp;
            })[0];
            loadConversation(mostRecentId);
        } else {
            // Create new conversation if none exists
            createNewConversation();
        }
    } else {
        // First time user, create new conversation
        createNewConversation();
    }
}

// Create a new conversation
function createNewConversation() {
    const newId = 'conv_' + Date.now();
    
    conversations[newId] = {
        id: newId,
        title: 'New Conversation',
        messages: [],
        timestamp: Date.now()
    };
    
    currentConversationId = newId;
    
    saveConversations();
    
    updateConversationList();
    clearChat();
    
    setActiveConversation(newId);
}

function saveConversations() {
    localStorage.setItem('jaeveAIConversations', JSON.stringify(conversations));
    localStorage.setItem('jaeveAILastConversation', currentConversationId);
}

function updateConversationList() {
    groupConversationsByDate();
}

function loadConversation(conversationId) {
    if (!conversations[conversationId]) return;
    
    currentConversationId = conversationId;
    localStorage.setItem('jaeveAILastConversation', currentConversationId);
    
    clearChat();
    
    setActiveConversation(conversationId);
    const currentConv = conversations[conversationId];
    
    // Display messages in chat
    const chat = document.querySelector('.chat');
    
    for (let i = 0; i < currentConv.messages.length; i += 2) {
        const userMsg = currentConv.messages[i];
        const modelMsg = currentConv.messages[i + 1];
        
        if (userMsg && userMsg.role === 'user') {
            chat.insertAdjacentHTML('beforeend', `
                <div class="user">
                    <p>${userMsg.parts[0].text}</p>
                </div>
            `);
        }
        
        if (modelMsg && modelMsg.role === 'model') {
            chat.insertAdjacentHTML('beforeend', `
                <div class="model">
                    <p>${modelMsg.parts[0].text}</p>
                </div>
            `);
        }
    }
    
    scrollChatToBottom();
}

function setActiveConversation(conversationId) {
    document.querySelectorAll('.conversation-item').forEach(item => {
        if (item.dataset.id === conversationId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function clearChat() {
    document.querySelector('.chat').innerHTML = '';
    
    document.querySelector('.suggestions').style.display = 'block';
}

function scrollChatToBottom() {
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideSuggestions() {
    document.querySelector('.suggestions').style.display = 'none';
}

async function sendMessage() {
    const userMessage = document.querySelector(".input-area input").value;
    
    if (!userMessage.length) return;
    
    try {
        document.querySelector(".input-area input").value = "";
        
        hideSuggestions();
        
        document.querySelector(".chat").insertAdjacentHTML("beforeend", `
            <div class="user">
                <p>${userMessage}</p>
            </div>
        `);
        
        document.querySelector(".chat").insertAdjacentHTML("beforeend", `
            <div class="loader"></div>
        `);
        
        scrollChatToBottom();
        
        let historyMessages = [];
        if (currentConversationId && conversations[currentConversationId]) {
            historyMessages = conversations[currentConversationId].messages;
        }
        
        const chat = model.startChat({
            history: historyMessages
        });
        
        let result = await chat.sendMessageStream(userMessage);
        
        document.querySelector(".chat").insertAdjacentHTML("beforeend", `
            <div class="model">
                <p></p>
            </div>
        `);
        
        let modelResponseText = '';
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            modelResponseText += chunkText;
            const modelMessages = document.querySelectorAll(".chat .model");
            modelMessages[modelMessages.length - 1].querySelector("p").innerHTML = modelResponseText;
            
            scrollChatToBottom();
        }
        
        if (!conversations[currentConversationId]) {
            createNewConversation();
        }
        
        conversations[currentConversationId].messages.push({
            role: "user",
            parts: [{ text: userMessage }]
        });
        
        conversations[currentConversationId].messages.push({
            role: "model",
            parts: [{ text: modelResponseText }]
        });
        
        if (conversations[currentConversationId].messages.length === 2) {
            conversations[currentConversationId].title = userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
        }
        
        conversations[currentConversationId].timestamp = Date.now();
        
        saveConversations();
        
        updateConversationList();
        
    } catch (error) {
        console.error("Error sending message:", error);
        document.querySelector(".chat").insertAdjacentHTML("beforeend", `
            <div class="error">
                <p>The message could not be sent. Please try again.</p>
            </div>
        `);
    }
    
    const loader = document.querySelector(".chat .loader");
    if (loader) loader.remove();
    
    scrollChatToBottom();
}

function setupEventListeners() {
    document.querySelector(".send-button").addEventListener("click", sendMessage);
    
    document.querySelector(".input-area input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });
    
    document.querySelector(".new-chat-btn").addEventListener("click", createNewConversation);
    
    document.querySelectorAll(".suggestion-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelector(".input-area input").value = chip.textContent;
            sendMessage();
        });
    });
}

function setupSearch() {
    const searchToggle = document.querySelector('.search-toggle-btn');
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.querySelector('.search-input');
    const clearSearchBtn = document.querySelector('.clear-search-btn');
    
    searchToggle.addEventListener('click', () => {
        const isVisible = searchContainer.style.display !== 'none';
        searchContainer.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            filterConversations('');
            clearSearchBtn.style.display = 'none';
        }
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        filterConversations('');
        searchInput.focus();
    });
    
    searchInput.addEventListener('input', () => {
        const searchText = searchInput.value.trim();
        clearSearchBtn.style.display = searchText ? 'block' : 'none';
        filterConversations(searchText);
    });
}

function filterConversations(searchText) {
    const items = document.querySelectorAll('.conversation-item');
    const dateSeparators = document.querySelectorAll('.date-separator');
    
    if (!searchText) {
        items.forEach(item => item.style.display = 'block');
        dateSeparators.forEach(sep => sep.style.display = 'block');
        return;
    }
    
    searchText = searchText.toLowerCase();
    
    const visibleDateSections = new Set();
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        const matches = text.includes(searchText);
        item.style.display = matches ? 'block' : 'none';
        
        if (matches) {
            let currentEl = item.previousElementSibling;
            while (currentEl) {
                if (currentEl.classList.contains('date-separator')) {
                    visibleDateSections.add(currentEl);
                    break;
                }
                currentEl = currentEl.previousElementSibling;
            }
        }
    });
    
    dateSeparators.forEach(sep => {
        sep.style.display = visibleDateSections.has(sep) ? 'block' : 'none';
    });
}

function groupConversationsByDate() {
    const conversationList = document.querySelector('.conversation-list');
    conversationList.innerHTML = '';
    
    const sortedConversations = Object.values(conversations).sort((a, b) => {
        return b.timestamp - a.timestamp;
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const groups = {
        today: [],
        yesterday: [],
        lastWeek: [],
        older: []
    };
    
    sortedConversations.forEach(conv => {
        const convDate = new Date(conv.timestamp);
        convDate.setHours(0, 0, 0, 0);
        
        if (convDate.getTime() === today.getTime()) {
            groups.today.push(conv);
        } else if (convDate.getTime() === yesterday.getTime()) {
            groups.yesterday.push(conv);
        } else if (convDate >= lastWeek) {
            groups.lastWeek.push(conv);
        } else {
            groups.older.push(conv);
        }
    });
    
    const dateSeparators = document.querySelectorAll('.date-separator');
    let todaySeparatorExists = dateSeparators.length > 0;
    
    if (!todaySeparatorExists) {
        addDateSeparator('Today');
    }
    
    addConversationsToGroup(groups.today);
    
    if (groups.yesterday.length > 0) {
        addDateSeparator('Yesterday');
        addConversationsToGroup(groups.yesterday);
    }
    
    if (groups.lastWeek.length > 0) {
        addDateSeparator('Last 7 Days');
        addConversationsToGroup(groups.lastWeek);
    }
    
    if (groups.older.length > 0) {
        addDateSeparator('Older');
        addConversationsToGroup(groups.older);
    }
}

function addDateSeparator(label) {
    const conversationList = document.querySelector('.conversation-list');
    const separator = document.createElement('div');
    separator.className = 'date-separator';
    separator.innerHTML = `<span>${label}</span>`;
    conversationList.appendChild(separator);
}

function addConversationsToGroup(groupConversations) {
    const conversationList = document.querySelector('.conversation-list');
    
    groupConversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        if (conv.id === currentConversationId) {
            item.classList.add('active');
        }
        
        let displayTitle = conv.title;
        if (displayTitle === 'New Conversation' && conv.messages.length > 0) {
            const firstUserMessage = conv.messages.find(msg => msg.role === 'user');
            if (firstUserMessage) {
                displayTitle = firstUserMessage.parts[0].text.slice(0, 30) + (firstUserMessage.parts[0].text.length > 30 ? '...' : '');
            }
        }
        
        item.textContent = displayTitle;
        item.dataset.id = conv.id;
        
        item.addEventListener('click', () => {
            loadConversation(conv.id);
        });
        
        conversationList.appendChild(item);
    });
}

function init() {
    initConversations();
    setupEventListeners();
    setupSearch();
}

document.addEventListener('DOMContentLoaded', init);
