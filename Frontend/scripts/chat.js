// Simple Chat for chat.html
console.log('Chat script loaded');

const API_BASE = 'http://localhost:8080';
let currentUserId = null;
let currentUserEmail = null;

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing chat...');
    await initializeChat();

    // Setup user search
    const userSearchInput = document.getElementById('userSearchInput');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', handleUserSearchInput);
    }
});

// Handle user search input
let userSearchTimeout = null;
function handleUserSearchInput(e) {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('userSearchResults');
    if (!resultsContainer) return;

    if (userSearchTimeout) clearTimeout(userSearchTimeout);
    if (query.length < 2) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
        return;
    }
    // Debounce search
    userSearchTimeout = setTimeout(() => searchUsers(query), 300);
}

// Search users by name or email
async function searchUsers(query) {
    const token = localStorage.getItem('authToken');
    const resultsContainer = document.getElementById('userSearchResults');
    if (!token || !resultsContainer) return;

    resultsContainer.innerHTML = '<div style="padding: 12px; color: #666;">Searching...</div>';
    resultsContainer.style.display = 'block';

    try {
        const url = `${API_BASE}/api/auth/users/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const users = await response.json();
            showUserSearchResults(users);
        } else {
            resultsContainer.innerHTML = '<div style="padding: 12px; color: red;">Error searching users</div>';
        }
    } catch (error) {
        resultsContainer.innerHTML = '<div style="padding: 12px; color: red;">Error searching users</div>';
    }
}

// Show user search results
function showUserSearchResults(users) {
    const resultsContainer = document.getElementById('userSearchResults');
    if (!resultsContainer) return;
    if (!users || users.length === 0) {
        resultsContainer.innerHTML = '<div style="padding: 12px; color: #666;">No users found</div>';
        return;
    }
    resultsContainer.innerHTML = '';
    users.forEach(user => {
        // Don't show yourself
        if (user.email === currentUserEmail) return;
        const userDiv = document.createElement('div');
        userDiv.className = 'user-search-item';
        userDiv.style.cssText = 'padding: 12px; cursor: pointer; border-bottom: 1px solid #eee;';
        userDiv.innerHTML = `<strong>${user.name || user.email}</strong><br><span style="color: #888; font-size: 13px;">${user.email}</span>`;
        userDiv.onclick = () => createChatWithUser(user);
        resultsContainer.appendChild(userDiv);
    });
}

// Create chat with selected user
async function createChatWithUser(user) {
    const token = localStorage.getItem('authToken');
    if (!token || !user || !user.email) return;
    const resultsContainer = document.getElementById('userSearchResults');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div style="padding: 12px; color: #666;">Creating chat...</div>';
    }
    try {
        const response = await fetch(`${API_BASE}/api/chat/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ otherUserEmail: user.email })
        });
        if (response.ok) {
            const data = await response.json();
            // Hide search results
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
                resultsContainer.innerHTML = '';
            }
            
            // Set current chat ID immediately
            if (data.chat && data.chat.id) {
                window.currentChatId = data.chat.id;
                console.log('💫 Created new chat with ID:', data.chat.id);
                console.log('💫 Set currentChatId immediately to:', window.currentChatId);
                
                // Find chat name
                let chatName = user.name || user.email;
                
                // Reload chats and open the new chat
                await loadUserMessages();
                
                // Set active class on the new chat in the sidebar
                setTimeout(() => {
                    const chatItems = document.querySelectorAll('.chat-item');
                    chatItems.forEach(item => {
                        if (item.getAttribute('data-chat-id') === data.chat.id) {
                            chatItems.forEach(i => i.classList.remove('active'));
                            item.classList.add('active');
                            console.log('💫 Set active class for chat:', data.chat.id);
                        }
                    });
                }, 100);

                // Open messages area for the new chat
                fetchAndDisplayMessages(data.chat.id, chatName);
            }
        } else {
            if (resultsContainer) {
                resultsContainer.innerHTML = '<div style="padding: 12px; color: red;">Error creating chat</div>';
            }
        }
    } catch (error) {
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div style="padding: 12px; color: red;">Error creating chat</div>';
        }
    }
}
// Initialize chat system
async function initializeChat() {
    console.log('Initializing chat...');

    // Get current user info from JWT
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('No auth token found');
        showError('Please login to use chat');
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserEmail = payload.sub;
        console.log('Current user email:', currentUserEmail);

        // Get current user ID (with fallback)
        await getCurrentUserId();

        // Load messages (continue even if user ID fetch failed)
        await loadUserMessages();

    } catch (error) {
        console.error('Error initializing chat:', error);
        showError('Failed to initialize chat: ' + error.message);
    }
}

// Get current user ID from backend
async function getCurrentUserId() {
    const token = localStorage.getItem('authToken');

    try {
        console.log('Searching for user with email:', currentUserEmail);
        
        // First try the search API
        const searchUrl = `${API_BASE}/api/auth/users/search?query=${encodeURIComponent(currentUserEmail)}`;
        console.log('Search URL:', searchUrl);
        
        const response = await fetch(searchUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Search response status:', response.status);
        
        if (response.ok) {
            const users = await response.json();
            console.log('All users from search:', users);
            
            const currentUser = users.find(user => {
                console.log('Comparing:', user.email, 'with', currentUserEmail);
                return user.email === currentUserEmail;
            });
            
            if (currentUser) {
                currentUserId = currentUser.id;
                console.log('✅ Current user ID found from search:', currentUserId);
                return;
            }
        }
        
        // If search fails, try to find user by making a request to get all users
        console.log('Search failed, trying alternative method...');
        
        // Get user info using a different approach - try to get user by ID from JWT
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.userId) {
            currentUserId = payload.userId;
            console.log('✅ Current user ID found from JWT:', currentUserId);
            return;
        }
        
        // Last resort: manually search through all possible user endpoints
        console.log('Trying to find user through chat participants...');
        
        // Get chats and extract user IDs to find which one belongs to current user
        const chatsResponse = await fetch(`${API_BASE}/api/chat/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (chatsResponse.ok) {
            const chats = await chatsResponse.json();
            console.log('Chats for finding user ID:', chats);
            
            // Try to identify current user by checking which user appears most in chats
            if (chats.length > 0 && chats[0].userIds) {
                for (const userId of chats[0].userIds) {
                    try {
                        const userResponse = await fetch(`${API_BASE}/api/auth/users/${userId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (userResponse.ok) {
                            const user = await userResponse.json();
                            console.log('Checking user:', user);
                            
                            if (user.email === currentUserEmail) {
                                currentUserId = user.id;
                                console.log('✅ Current user ID found from chat participants:', currentUserId);
                                return;
                            }
                        }
                    } catch (e) {
                        console.log('Failed to get user info for:', userId);
                    }
                }
            }
        }
        
        // If all else fails, throw error
        throw new Error('Could not determine current user ID');
        
    } catch (error) {
        console.error('Error getting current user ID:', error);
        
        // Don't use email as fallback since it doesn't match message senderIds
        currentUserId = null;
        console.log('⚠️ Could not determine user ID - message alignment may be incorrect');
    }
    
    console.log('Final currentUserId set to:', currentUserId);
    console.log('Final currentUserEmail set to:', currentUserEmail);
}

// Load user's chats
async function loadUserMessages() {
    console.log('📋 Loading user chats...');
    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`${API_BASE}/api/chat/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('📋 Response status:', response.status);

        if (response.ok) {
            const chats = await response.json();
            console.log('📋 Loaded chats:', chats);
            console.log('📋 Number of chats:', chats.length);
            
            // Log each chat ID for debugging and check for duplicates
            chats.forEach((chat, index) => {
                console.log(`📋 Chat ${index + 1} - ID: ${chat.id}, UserIds:`, chat.userIds);
            });
            
            // Check for duplicate chats (same users)
            const userPairMap = new Map();
            chats.forEach((chat, index) => {
                if (chat.userIds && chat.userIds.length === 2) {
                    const sortedUsers = [...chat.userIds].sort().join(',');
                    if (userPairMap.has(sortedUsers)) {
                        console.warn(`⚠️ DUPLICATE CHAT DETECTED!`);
                        console.warn(`⚠️ Chat ${index + 1} (${chat.id}) has same users as Chat ${userPairMap.get(sortedUsers).index + 1} (${userPairMap.get(sortedUsers).id})`);
                        console.warn(`⚠️ Users: ${chat.userIds}`);
                    } else {
                        userPairMap.set(sortedUsers, { id: chat.id, index });
                    }
                }
            });

            if (chats.length > 0) {
                // Show chat list in left sidebar
                displayChatList(chats);
            } else {
                showNoChatsList();
            }
        } else {
            console.error('Failed to load chats:', response.status);
            showChatListError('Failed to load chats');
        }
    } catch (error) {
        console.error('Error loading chats:', error);
        showChatListError('Error loading chats');
    }
}

// Display chat list in left sidebar
async function displayChatList(chats) {
    const container = document.getElementById('chatList');
    if (!container) {
        console.error('Chat list container not found');
        return;
    }

    container.innerHTML = '';

    for (let i = 0; i < chats.length; i++) {
        const chat = chats[i];
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.setAttribute('data-chat-id', chat.id);
        
        // Get other user's name for the chat
        let chatName = `Chat ${i + 1}`;
        if (chat.userIds && chat.userIds.length > 0) {
            try {
                // Find the other user (not current user)
                const otherUserId = chat.userIds.find(id => id !== currentUserId);
                if (otherUserId) {
                    const otherUser = await getUserInfo(otherUserId);
                    chatName = otherUser.name || otherUser.email || `Chat ${i + 1}`;
                }
            } catch (error) {
                console.error('Error getting chat name:', error);
                chatName = `Chat ${i + 1}`;
            }
        }
        
        chatItem.innerHTML = `
            <div style="font-weight: bold; font-size: 16px;">${chatName}</div>
            <div style="color: #999; font-size: 12px; margin-top: 5px;">Click to view messages</div>
        `;
        
        // Click handler to show messages for this chat
        chatItem.onclick = () => {
            // Remove active class from all chat items
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked item
            chatItem.classList.add('active');
            
            console.log('Chat clicked:', chat.id);
            fetchAndDisplayMessages(chat.id, chatName);
        };
        
        container.appendChild(chatItem);
    }
    
    console.log('Chat list displayed');
}

// Show message when no chats found
function showNoChatsList() {
    const container = document.getElementById('chatList');
    if (container) {
        container.innerHTML = '<div class="no-messages">No chats found</div>';
    }
}

// Show error in chat list
function showChatListError(message) {
    const container = document.getElementById('chatList');
    if (container) {
        container.innerHTML = `<div style="padding: 20px; color: red;">${message}</div>`;
    }
}

// Get user info by ID
async function getUserInfo(userId) {
    const token = localStorage.getItem('authToken');
    if (!token) return { name: 'Unknown', email: 'unknown' };

    try {
        const response = await fetch(`${API_BASE}/api/auth/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error('Failed to fetch user info:', response.status);
            return { name: `User${userId.slice(-4)}`, email: 'unknown' };
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        return { name: `User${userId.slice(-4)}`, email: 'unknown' };
    }
}

// Fetch and display messages for a chat
async function fetchAndDisplayMessages(chatId, chatName = 'Chat') {
    console.log('🔍 Fetching messages for chat:', chatId);
    console.log('🔍 Chat name:', chatName);
    console.log('🔍 Current window.currentChatId:', window.currentChatId);
    
    const token = localStorage.getItem('authToken');

    try {
        const url = `${API_BASE}/api/chat/${chatId}/messages`;
        console.log('🔍 Fetching from URL:', url);
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('🔍 Response status:', response.status);

        if (response.ok) {
            const messages = await response.json();
            console.log('🔍 Messages fetched for chat', chatId, ':', messages);
            console.log('🔍 Number of messages:', messages.length);
            displayMessagesForChat(messages, chatName);
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to fetch messages:', response.status, errorText);
            showChatMessage('Failed to fetch messages: ' + response.status);
        }
    } catch (error) {
        console.error('❌ Error fetching messages:', error);
        showChatMessage('Error fetching messages: ' + error.message);
    }
}

// Display messages for a specific chat
function displayMessagesForChat(messages, chatName) {
    console.log('🎯 Displaying messages for chat:', chatName);
    console.log('🎯 Messages to display:', messages);
    console.log('🎯 Number of messages:', messages.length);
    
    const container = document.getElementById('chatMessagesContainer');
    if (!container) {
        console.error('Messages container not found');
        return;
    }

    // Clear container and add header (no dashboard button)
    container.innerHTML = `
        <div class="chat-header">${chatName}</div>
        <div id="messagesArea"></div>
        <div class="message-input-area">
            <textarea 
                id="messageInput" 
                class="message-input" 
                placeholder="Type a message..." 
                rows="1"
                onkeydown="handleMessageInputKeydown(event)"
                oninput="autoResizeTextarea(event)"
            ></textarea>
            <button id="sendButton" class="send-button" onclick="sendMessage()">
                ➤
            </button>
        </div>
    `;

    const messagesArea = document.getElementById('messagesArea');

    if (messages.length === 0) {
        messagesArea.innerHTML = '<div class="no-messages">No messages in this chat</div>';
        console.log('🎯 No messages to display');
    } else {
        displayMessageList(messages, messagesArea);
    }

    // Store current chat ID for sending messages - use the active chat or fallback
    const activeChat = document.querySelector('.chat-item.active');
    if (activeChat) {
        window.currentChatId = activeChat.getAttribute('data-chat-id');
        console.log('🎯 Set currentChatId from active chat:', window.currentChatId);
    } else {
        console.log('🎯 No active chat found, currentChatId remains:', window.currentChatId);
    }
    
    // Focus on message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.focus();
    }
}

// Helper function to display the actual message list
function displayMessageList(messages, messagesArea) {
    console.log('Current user ID for comparison:', currentUserId);
    console.log('Current user email for comparison:', currentUserEmail);


    // Cache for sender info to avoid duplicate requests
    const senderCache = {};

    // Helper to get sender name (async)
    async function getSenderName(senderId, senderEmail) {
        if (senderId === currentUserId) return 'You';
        if (senderCache[senderId]) return senderCache[senderId];
        try {
            const user = await getUserInfo(senderId);
            const name = user.name || user.email || senderEmail || 'Unknown';
            senderCache[senderId] = name;
            return name;
        } catch {
            return senderEmail || 'Unknown';
        }
    }

    // Render all messages (async for sender name)
    (async () => {
        for (let index = 0; index < messages.length; index++) {
            const msg = messages[index];
            const msgDiv = document.createElement('div');

            // Debug each message
            console.log(`Message ${index}:`, {
                content: msg.content,
                senderId: msg.senderId,
                currentUserId: currentUserId,
                senderEmail: msg.senderEmail,
                currentUserEmail: currentUserEmail
            });

            // Check if message is from current user - try multiple ways
            let isMyMessage = false;
            if (currentUserId && msg.senderId) {
                isMyMessage = msg.senderId === currentUserId;
            } else if (currentUserEmail && msg.senderEmail) {
                isMyMessage = msg.senderEmail === currentUserEmail;
            } else if (currentUserEmail && msg.senderId) {
                isMyMessage = msg.senderId === currentUserEmail;
            }

            if (isMyMessage) {
                // My message - right side, green
                msgDiv.style.cssText = 'display: flex; justify-content: flex-end; margin: 8px 0;';
                msgDiv.innerHTML = `
                    <div style="background: #dcf8c6; padding: 8px 12px; border-radius: 12px; max-width: 70%;">
                        <div style="font-size: 14px;">${msg.content}</div>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">You • ${new Date(msg.timestamp).toLocaleTimeString()}</div>
                    </div>
                `;
            } else {
                // Other message - left side, gray
                msgDiv.style.cssText = 'display: flex; justify-content: flex-start; margin: 8px 0;';
                const senderName = await getSenderName(msg.senderId, msg.senderEmail);
                msgDiv.innerHTML = `
                    <div style="background: #f1f1f1; padding: 8px 12px; border-radius: 12px; max-width: 70%;">
                        <div style="font-size: 14px;">${msg.content}</div>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">${senderName} • ${new Date(msg.timestamp).toLocaleTimeString()}</div>
                    </div>
                `;
            }

            messagesArea.appendChild(msgDiv);
        }
        // Scroll to bottom
        messagesArea.scrollTop = messagesArea.scrollHeight;
        console.log('Messages displayed for chat');
    })();

    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
    console.log('Messages displayed for chat');
}

// Go back to chat list (not needed in two-column layout, but keeping for compatibility)
function goBackToChats() {
    // In two-column layout, just clear the right side
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
        container.innerHTML = '<div class="welcome-message">Select a chat to view messages</div>';
    }
    
    // Remove active state from all chats
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Clear current chat ID
    window.currentChatId = null;
}

// Get current chat ID from active chat item
function getCurrentChatId() {
    const activeChat = document.querySelector('.chat-item.active');
    return activeChat ? activeChat.getAttribute('data-chat-id') : null;
}

// Handle keydown events in message input
function handleMessageInputKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Auto-resize textarea as user types
function autoResizeTextarea(event) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
}

// Send a message to the current chat
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    if (!messageInput || !sendButton) {
        console.error('Message input or send button not found');
        return;
    }
    
    const content = messageInput.value.trim();
    if (!content) {
        console.log('Empty message, not sending');
        return;
    }
    
    const chatId = window.currentChatId;
    if (!chatId) {
        console.error('No active chat selected');
        showError('Please select a chat first');
        return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('No auth token found');
        showError('Please login to send messages');
        return;
    }
    
    // Disable input and button while sending
    messageInput.disabled = true;
    sendButton.disabled = true;
    sendButton.innerHTML = '...';
    
    try {
        console.log('Sending message to chat:', chatId, 'content:', content);
        
        const response = await fetch(`${API_BASE}/api/chat/${chatId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content
            })
        });
        
        if (response.ok) {
            const newMessage = await response.json();
            console.log('✅ Message sent successfully:', newMessage);
            console.log('✅ Message was sent to chatId:', newMessage.chatId);
            console.log('✅ Current window.currentChatId:', window.currentChatId);
            
            // Verify the chatIds match
            if (newMessage.chatId !== window.currentChatId) {
                console.warn('⚠️ MISMATCH: Message sent to different chat!');
                console.warn('⚠️ Sent to:', newMessage.chatId);
                console.warn('⚠️ Expected:', window.currentChatId);
            }
            
            // Clear input
            messageInput.value = '';
            
            // Refresh messages for current chat
            const activeChat = document.querySelector('.chat-item.active');
            if (activeChat) {
                const activeChatId = activeChat.getAttribute('data-chat-id');
                const chatName = activeChat.querySelector('div').textContent;
                console.log('🔄 Refreshing messages for active chat:', activeChatId);
                console.log('🔄 Using chatId from newMessage:', newMessage.chatId);
                
                // Use the chatId from the sent message to ensure we fetch from correct chat
                await fetchAndDisplayMessages(newMessage.chatId, chatName);
            }
            
        } else {
            console.error('Failed to send message:', response.status);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            showError('Failed to send message: ' + response.status);
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Error sending message: ' + error.message);
    } finally {
        // Re-enable input and button
        messageInput.disabled = false;
        sendButton.disabled = false;
        sendButton.innerHTML = '➤';
        messageInput.focus();
    }
}

// Display messages in the chat area
function displayMessages(messages) {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) {
        console.error('Messages container not found');
        return;
    }

    if (messages.length === 0) {
        container.innerHTML += '<div class="no-messages">No messages in this chat</div>';
        return;
    }

    messages.forEach(msg => {
        const msgDiv = document.createElement('div');

        // Check if message is from current user
        const isMyMessage = msg.senderId === currentUserId;

        if (isMyMessage) {
            // My message - right side, green
            msgDiv.style.cssText = 'display: flex; justify-content: flex-end; margin: 8px 0;';
            msgDiv.innerHTML = `
                <div style="background: #dcf8c6; padding: 8px 12px; border-radius: 12px; max-width: 70%;">
                    <div style="font-size: 14px;">${msg.content}</div>
                    <div style="font-size: 11px; color: #666; margin-top: 4px;">You • ${new Date(msg.timestamp).toLocaleTimeString()}</div>
                </div>
            `;
        } else {
            // Other message - left side, gray
            msgDiv.style.cssText = 'display: flex; justify-content: flex-start; margin: 8px 0;';
            msgDiv.innerHTML = `
                <div style="background: #f1f1f1; padding: 8px 12px; border-radius: 12px; max-width: 70%;">
                    <div style="font-size: 14px;">${msg.content}</div>
                    <div style="font-size: 11px; color: #666; margin-top: 4px;">Other • ${new Date(msg.timestamp).toLocaleTimeString()}</div>
                </div>
            `;
        }

        container.appendChild(msgDiv);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
    console.log('Messages displayed');
}

// Helper functions
function showError(message) {
    const container = document.getElementById('chatApp');
    if (container) {
        container.innerHTML = `<div style="padding: 20px; color: red;">${message}</div>`;
    }
}

function showChatMessage(message) {
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
        container.innerHTML = `<div style="padding: 20px;">${message}</div>`;
    }
}

// Make functions globally available
window.goBackToChats = goBackToChats;
window.sendMessage = sendMessage;
window.handleMessageInputKeydown = handleMessageInputKeydown;
window.autoResizeTextarea = autoResizeTextarea;
