console.log('Real-time chat script loaded');

const API_BASE = 'http://localhost:8080';
let currentUserId = null;
let currentUserEmail = null;
let currentChatId = null;
let currentChatType = 'INDIVIDUAL'; // 'INDIVIDUAL' or 'GROUP'
let stompClient = null;
let isConnected = false;

// User info cache to prevent repeated API calls
const userInfoCache = new Map();

// Group chat data
let currentTab = 'individual'; // 'individual' or 'group'
let selectedParticipants = new Map(); // For group creation

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing real-time chat...');
    
    await initializeAuthOrBusiness();
    await connectWebSocket();
    await loadChats();
    
    // Setup user search
    const userSearchInput = document.getElementById('userSearchInput');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', handleUserSearchInput);
    }
    
    // Setup navigation buttons
    setupNavigationButtons();
    
    // Setup tab switching
    setupTabSwitching();
    
    // Setup group chat functionality
    setupGroupChatFunctionality();
    
    // Setup send button and input
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

// Initialize authentication
async function initializeAuthOrBusiness() {
    try {
        const token = localStorage.getItem('authToken');
        if (token) {
            // Normal user flow
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserEmail = payload.sub;
            console.log('🔑 Current user email from JWT:', currentUserEmail);
            // Try to get user ID from the search endpoint (more reliable)
            try {
                const searchResponse = await fetch(`${API_BASE}/api/auth/users/search?query=${encodeURIComponent(currentUserEmail)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (searchResponse.ok) {
                    const users = await searchResponse.json();
                    const user = users.find(u => u.email === currentUserEmail);
                    if (user) {
                        currentUserId = user.id;
                        console.log('✅ Current user found via search:', user.name, user.id);
                        updateUserNameInHeader(user.name, user.email);
                        return;
                    }
                }
            } catch (error) {
                console.warn('Search method failed, trying alternative...');
            }
            // Fallback: Try to get user ID from existing chat participants
            try {
                const chatsResponse = await fetch(`${API_BASE}/api/chat/my`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (chatsResponse.ok) {
                    const chats = await chatsResponse.json();
                    if (chats.length > 0) {
                        for (const chat of chats) {
                            for (const userId of chat.userIds) {
                                try {
                                    const userResponse = await fetch(`${API_BASE}/api/auth/users/${userId}`, {
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (userResponse.ok) {
                                        const user = await userResponse.json();
                                        if (user.email === currentUserEmail) {
                                            currentUserId = user.id;
                                            console.log('✅ Current user found via chat participants:', user.name, user.id);
                                            updateUserNameInHeader(user.name, user.email);
                                            return;
                                        }
                                    }
                                } catch (e) {}
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn('Chat participants method failed');
            }
            // If all else fails, create a temporary ID (this shouldn't happen in production)
            console.error('❌ Could not determine current user ID, using email as fallback');
            currentUserId = currentUserEmail;
            updateUserNameInHeader(null, currentUserEmail);
        } else {
            // Business user flow (no login required)
            const business = JSON.parse(localStorage.getItem('businessInfo'));
            if (business && business.id && business.email) {
                currentUserId = business.id;
                currentUserEmail = business.email;
                window.isBusinessUser = true;
                updateUserNameInHeader(business.companyName || business.email, business.email);
                console.log('🏢 Business user detected:', business);
            } else {
                // No auth, no business info: redirect to home
                console.error('❌ No auth or business info found. Redirecting.');
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('❌ Auth/Business error:', error);
        window.location.href = 'index.html';
    }
}

// Update user name in header
function updateUserNameInHeader(userName, userEmail) {
    const userInfoDiv = document.getElementById('currentUserInfo');
    const userNameSpan = document.getElementById('currentUserName');
    
    if (userInfoDiv && userNameSpan) {
        if (userName) {
            userNameSpan.textContent = userName;
        } else {
            // Fallback to email if name not available
            userNameSpan.textContent = userEmail || 'Unknown User';
        }
        
        // Show the user info
        userInfoDiv.style.display = 'block';
        console.log('👤 Updated header with user:', userName || userEmail);
    }
}

// Connect to WebSocket
async function connectWebSocket() {
    try {
        console.log('🔗 Connecting to WebSocket...');
        
        const socket = new SockJS(`${API_BASE}/ws`);
        stompClient = new StompJs.Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log('STOMP:', str),
            onConnect: () => {
                console.log('✅ WebSocket connected');
                isConnected = true;
                updateConnectionStatus(true);
            },
            onDisconnect: () => {
                console.log('❌ WebSocket disconnected');
                isConnected = false;
                updateConnectionStatus(false);
            },
            onStompError: (frame) => {
                console.error('❌ WebSocket error:', frame);
                updateConnectionStatus(false);
            }
        });
        
        stompClient.activate();
        
    } catch (error) {
        console.error('❌ WebSocket connection error:', error);
        updateConnectionStatus(false);
    }
}

// Update connection status
function updateConnectionStatus(connected) {
    const status = document.getElementById('connectionStatus');
    if (connected) {
        status.textContent = 'Connected';
        status.className = 'status connected';
    } else {
        status.textContent = 'Disconnected';
        status.className = 'status disconnected';
    }
}

// Load user's chats
async function loadChats() {
    try {
        await loadIndividualChats();
        await loadGroupChats();
        
        // Display based on current tab
        if (currentTab === 'individual') {
            showIndividualChats();
        } else {
            showGroupChats();
        }
    } catch (error) {
        console.error('❌ Error loading chats:', error);
    }
}

// Load individual chats
async function loadIndividualChats() {
    let headers = {};
    if (window.isBusinessUser) {
        const business = JSON.parse(localStorage.getItem('businessInfo'));
        headers['X-Business-Id'] = business.id;
        headers['X-Business-Email'] = business.email;
    } else {
        const token = localStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}/api/chat/my`, { headers });
    if (response.ok) {
        const chats = await response.json();
        window.individualChats = chats;
        console.log('📋 Loaded individual chats:', chats.length);
    } else {
        window.individualChats = [];
    }
}

// Load group chats
async function loadGroupChats() {
    try {
        let headers = {};
        if (window.isBusinessUser) {
            const business = JSON.parse(localStorage.getItem('businessInfo'));
            headers['X-Business-Id'] = business.id;
            headers['X-Business-Email'] = business.email;
        } else {
            const token = localStorage.getItem('authToken');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_BASE}/api/groupchat/my`, { headers });
        if (response.ok) {
            const groupChats = await response.json();
            window.groupChats = groupChats;
            console.log('📋 Loaded group chats:', groupChats.length);
        } else {
            window.groupChats = [];
        }
    } catch (error) {
        console.error('❌ Error loading group chats:', error);
        window.groupChats = [];
    }
}

// Show individual chats
async function showIndividualChats() {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';
    
    if (!window.individualChats || window.individualChats.length === 0) {
        chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No individual chats yet</div>';
        return;
    }
    
    for (const chat of window.individualChats) {
        const otherUserId = chat.userIds.find(id => id !== currentUserId);
        
        try {
            const otherUser = await getUserInfo(otherUserId);
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.innerHTML = `
                <div>
                    <strong>${otherUser.name}</strong>
                    <div style="font-size: 12px; color: #666;">${otherUser.email}</div>
                </div>
            `;
            chatItem.onclick = () => openChat(chat.id, otherUser.name, 'INDIVIDUAL');
            chatList.appendChild(chatItem);
        } catch (error) {
            console.error('❌ Error getting user info:', error);
        }
    }
}

// Show group chats
async function showGroupChats() {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';
    
    if (!window.groupChats || window.groupChats.length === 0) {
        chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No group chats yet</div>';
        return;
    }
    
    for (const groupChat of window.groupChats) {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.innerHTML = `
            <div>
                <strong>${groupChat.name} <span class="group-indicator">GROUP</span></strong>
                <div style="font-size: 12px; color: #666;">${groupChat.participantIds.length} members</div>
            </div>
        `;
        chatItem.onclick = () => openChat(groupChat.id, groupChat.name, 'GROUP');
        chatList.appendChild(chatItem);
    }
}

// Get user info
async function getUserInfo(userId) {
    // Check cache first
    if (userInfoCache.has(userId)) {
        console.log('📋 Using cached user info for:', userId);
        return userInfoCache.get(userId);
    }
    
    let headers = {};
    if (window.isBusinessUser) {
        const business = JSON.parse(localStorage.getItem('businessInfo'));
        headers['X-Business-Id'] = business.id;
        headers['X-Business-Email'] = business.email;
    } else {
        const token = localStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        const response = await fetch(`${API_BASE}/api/auth/users/${userId}`, { headers });
        if (response.ok) {
            const userInfo = await response.json();
            userInfoCache.set(userId, userInfo);
            console.log('✅ Fetched and cached user info:', userInfo.name);
            return userInfo;
        }
        console.log('User not found by ID, trying search fallback...');
        const searchResponse = await fetch(`${API_BASE}/api/auth/users/search?query=${userId}`, { headers });
        if (searchResponse.ok) {
            const users = await searchResponse.json();
            const user = users.find(u => u.id === userId);
            if (user) {
                userInfoCache.set(userId, user);
                return user;
            }
        }
        const fallbackUser = { id: userId, name: `User-${userId.slice(-4)}`, email: 'unknown@email.com' };
        userInfoCache.set(userId, fallbackUser);
        return fallbackUser;
    } catch (error) {
        console.error('❌ Error fetching user info:', error);
        const fallbackUser = { id: userId, name: `User-${userId.slice(-4)}`, email: 'unknown@email.com' };
        userInfoCache.set(userId, fallbackUser);
        return fallbackUser;
    }
}

// Open chat and subscribe to messages
async function openChat(chatId, chatName, chatType = 'INDIVIDUAL') {
    try {
        console.log('🗨️ Opening chat:', chatId, chatName, 'Type:', chatType);
        
        // Update UI
        currentChatId = chatId;
        currentChatType = chatType;
        
        const headerText = chatType === 'GROUP' 
            ? `👥 ${chatName}` 
            : `💬 ${chatName}`;
        document.getElementById('chatHeader').textContent = headerText;
        document.getElementById('inputArea').style.display = 'flex';
        
        // Update active chat in sidebar
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Find and highlight the clicked chat item
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            if ((chatType === 'GROUP' && item.textContent.includes(chatName) && item.textContent.includes('GROUP')) ||
                (chatType === 'INDIVIDUAL' && item.textContent.includes(chatName) && !item.textContent.includes('GROUP'))) {
                item.classList.add('active');
            }
        });
        
        // Load existing messages
        await loadMessages(chatId, chatType);
        
        // Subscribe to real-time messages
        if (stompClient && stompClient.connected) {
            // Unsubscribe from previous chat if any
            if (window.currentSubscription) {
                window.currentSubscription.unsubscribe();
            }
            
            // Subscribe to new chat
            window.currentSubscription = stompClient.subscribe(`/topic/chat/${chatId}`, (message) => {
                console.log('📨 Raw WebSocket message received:', message);
                const messageData = JSON.parse(message.body);
                console.log('📨 Parsed message data:', messageData);
                displayMessage(messageData);
            });
            
            // Send join notification
            stompClient.publish({
                destination: '/app/joinChat',
                body: JSON.stringify({
                    chatId: chatId,
                    userId: currentUserId,
                    chatType: chatType
                })
            });
        }
        
    } catch (error) {
        console.error('❌ Error opening chat:', error);
    }
}

// Load existing messages
async function loadMessages(chatId, chatType = 'INDIVIDUAL') {
    try {
        let headers = {};
        if (window.isBusinessUser) {
            const business = JSON.parse(localStorage.getItem('businessInfo'));
            headers['X-Business-Id'] = business.id;
            headers['X-Business-Email'] = business.email;
        } else {
            const token = localStorage.getItem('authToken');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const endpoint = chatType === 'GROUP' 
            ? `${API_BASE}/api/groupchat/${chatId}/messages`
            : `${API_BASE}/api/chat/${chatId}/messages`;
        const response = await fetch(endpoint, { headers });
        if (response.ok) {
            const messages = await response.json();
            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = '';
            for (const message of messages) {
                let senderName = 'Unknown';
                if (message.senderId === currentUserId) {
                    senderName = 'You';
                } else {
                    try {
                        const sender = await getUserInfo(message.senderId);
                        senderName = sender.name || sender.email || 'Unknown';
                    } catch (error) {
                        console.error('Error getting sender info:', error);
                        senderName = 'Unknown';
                    }
                }
                displayMessage({
                    id: message.id,
                    chatId: message.chatId,
                    senderId: message.senderId,
                    senderName: senderName,
                    content: message.content,
                    messageType: chatType,
                    timestamp: message.timestamp
                });
            }
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    } catch (error) {
        console.error('❌ Error loading messages:', error);
    }
}

// Display a message in the chat
function displayMessage(messageData) {
    // Skip non-chat messages
    if (messageData.type && messageData.type !== 'CHAT') {
        if (messageData.type === 'JOIN') {
            console.log('👋 User joined:', messageData.userName);
        }
        return;
    }
    
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    
    // Check if message is from current user
    const isMyMessage = messageData.senderId === currentUserId;
    const time = messageData.timestamp ? new Date(messageData.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    
    if (isMyMessage) {
        // My message - right side, green (like normal chat)
        messageDiv.style.cssText = 'display: flex; justify-content: flex-end; margin: 8px 0;';
        messageDiv.innerHTML = `
            <div style="background: #dcf8c6; padding: 8px 12px; border-radius: 12px; max-width: 70%;">
                <div style="font-size: 14px;">${messageData.content}</div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">You • ${time}</div>
            </div>
        `;
    } else {
        // Other message - left side, gray (like normal chat)
        messageDiv.style.cssText = 'display: flex; justify-content: flex-start; margin: 8px 0;';
        const senderName = messageData.senderName || 'Unknown';
        messageDiv.innerHTML = `
            <div style="background: #f1f1f1; padding: 8px 12px; border-radius: 12px; max-width: 70%;">
                <div style="font-size: 14px;">${messageData.content}</div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">${senderName} • ${time}</div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message
function sendMessage() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    const content = input.value.trim();
    if (!content || !currentChatId || !stompClient || !stompClient.connected) {
        return;
    }
    
    // Disable input
    input.disabled = true;
    sendBtn.disabled = true;
    
    try {
        // Send via WebSocket
        stompClient.publish({
            destination: '/app/sendMessage',
            body: JSON.stringify({
                chatId: currentChatId,
                senderId: currentUserId,
                content: content,
                messageType: currentChatType
            })
        });
        
        // Clear input
        input.value = '';
        console.log('📤 Message sent:', content, 'Type:', currentChatType);
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
    } finally {
        // Re-enable input
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }
}

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
    let headers = {};
    const resultsContainer = document.getElementById('userSearchResults');
    if (!resultsContainer) return;
    if (window.isBusinessUser) {
        const business = JSON.parse(localStorage.getItem('businessInfo'));
        headers['X-Business-Id'] = business.id;
        headers['X-Business-Email'] = business.email;
    } else {
        const token = localStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    resultsContainer.innerHTML = '<div style="padding: 12px; color: #666;">Searching...</div>';
    resultsContainer.style.display = 'block';
    try {
        const url = `${API_BASE}/api/auth/users/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(url, { headers });
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
        userDiv.style.cssText = 'padding: 12px; cursor: pointer; border-bottom: 1px solid #eee; transition: background-color 0.2s;';
        userDiv.innerHTML = `<strong>${user.name || user.email}</strong><br><span style="color: #888; font-size: 13px;">${user.email}</span>`;
        userDiv.onclick = () => createChatWithUser(user);
        
        // Add hover effect
        userDiv.onmouseenter = () => userDiv.style.backgroundColor = '#f0f0f0';
        userDiv.onmouseleave = () => userDiv.style.backgroundColor = 'transparent';
        
        resultsContainer.appendChild(userDiv);
    });
}

// Create chat with selected user
async function createChatWithUser(user) {
    let headers = { 'Content-Type': 'application/json' };
    if (window.isBusinessUser) {
        const business = JSON.parse(localStorage.getItem('businessInfo'));
        headers['X-Business-Id'] = business.id;
        headers['X-Business-Email'] = business.email;
    } else {
        const token = localStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    if (!user || !user.email) return;
    const resultsContainer = document.getElementById('userSearchResults');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
    }
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    try {
        console.log('🚀 Creating chat with user:', user.name, user.email);
        userInfoCache.set(user.id, user);
        const response = await fetch(`${API_BASE}/api/chat/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ otherUserEmail: user.email })
        });
        if (response.ok) {
            const chat = await response.json();
            console.log('✅ Chat created/found:', chat.id);
            await loadChats();
            setTimeout(() => {
                openChat(chat.id, user.name || user.email);
            }, 100);
        } else {
            console.error('❌ Failed to create chat:', response.status);
        }
    } catch (error) {
        console.error('❌ Error creating chat:', error);
    }
}

// Setup navigation buttons
function setupNavigationButtons() {
    console.log('🔧 Setting up navigation buttons...');
    
    // Set up a basic dashboard button immediately as fallback
    const dashboardBtn = document.getElementById('backToDashboardBtn');
    if (dashboardBtn) {
        console.log('🔧 Found dashboard button, setting up basic fallback...');
        dashboardBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔧 Basic dashboard button clicked!');
            window.location.href = 'index.html';
        });
    } else {
        console.error('❌ Dashboard button not found in DOM!');
    }
    
    // Check if user is admin to show/hide admin button
    checkUserRoleAndSetupButtons();
    
    // Admin button
    const adminBtn = document.getElementById('backToAdminBtn');
    if (adminBtn) {
        adminBtn.onclick = () => {
            window.location.href = 'admin.html';
        };
    }
}

// Check user role and setup buttons accordingly
async function checkUserRoleAndSetupButtons() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        // Check localStorage cache first
        const cachedUserInfo = localStorage.getItem('currentUserInfo');
        if (cachedUserInfo) {
            try {
                const currentUser = JSON.parse(cachedUserInfo);
                setupDashboardButtonForUser(currentUser);
                return;
            } catch (e) {
                console.log('Failed to parse cached user info, fetching fresh...');
            }
        }
        
        // Decode JWT to check user role
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Fetch user details with roles
        try {
            const response = await fetch(`${API_BASE}/api/auth/users/search?query=${encodeURIComponent(payload.sub)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const users = await response.json();
                const currentUser = users.find(u => u.email === payload.sub);
                
                if (currentUser) {
                    // Cache user info in localStorage
                    localStorage.setItem('currentUserInfo', JSON.stringify(currentUser));
                    
                    // Update user name in header if not already set
                    const userNameSpan = document.getElementById('currentUserName');
                    if (userNameSpan && userNameSpan.textContent === 'Loading...') {
                        updateUserNameInHeader(currentUser.name, currentUser.email);
                    }
                    
                    setupDashboardButtonForUser(currentUser);
                }
            }
        } catch (error) {
            console.log('Could not determine user role:', error);
            setupFallbackDashboardButton();
        }
    } catch (error) {
        console.log('Error checking user role:', error);
        setupFallbackDashboardButton();
    }
}

// Setup dashboard button based on user info
function setupDashboardButtonForUser(currentUser) {
    const dashboardBtn = document.getElementById('backToDashboardBtn');
    console.log('🔧 Setting up dashboard button for user:', currentUser);
    console.log('🔧 Dashboard button element found:', !!dashboardBtn);
    
    if (!dashboardBtn) {
        console.error('❌ Dashboard button element not found!');
        return;
    }
    
    // Check for admin role using isAdmin property or ADMIN role
    const isAdmin = currentUser.isAdmin === true || 
                   (currentUser.roles && currentUser.roles.includes('ADMIN'));
    
    console.log('🔧 User admin status:', isAdmin);
    
    // Remove any existing event listeners by cloning the element
    const newBtn = dashboardBtn.cloneNode(true);
    dashboardBtn.parentNode.replaceChild(newBtn, dashboardBtn);
    
    if (isAdmin) {
        // Admin user - redirect to admin dashboard
        newBtn.innerHTML = '👑 Admin Dashboard';
        newBtn.style.background = '#dc3545';
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔧 Admin dashboard button clicked! Redirecting to admin.html');
            
            // Clear any state that might interfere
            localStorage.removeItem('appState');
            
            // Force redirect to admin page
            window.location.href = 'admin.html';
        });
        
        // Hide the separate admin button since dashboard button goes to admin
        const adminBtn = document.getElementById('backToAdminBtn');
        if (adminBtn) {
            adminBtn.style.display = 'none';
        }
        
        console.log('👑 Admin user detected - dashboard button redirects to admin');
    } else {
        // Regular user - redirect to normal dashboard
        newBtn.innerHTML = '🏠 Dashboard';
        newBtn.style.background = '#28a745';
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔧 User dashboard button clicked!');
            window.location.href = 'index.html';
        });
        
        console.log('👤 Regular user - dashboard button redirects to user dashboard');
    }
}

// Setup fallback dashboard button
function setupFallbackDashboardButton() {
    const dashboardBtn = document.getElementById('backToDashboardBtn');
    console.log('🔧 Setting up fallback dashboard button');
    console.log('🔧 Dashboard button element found:', !!dashboardBtn);
    
    if (dashboardBtn) {
        // Remove any existing event listeners by cloning the element
        const newBtn = dashboardBtn.cloneNode(true);
        dashboardBtn.parentNode.replaceChild(newBtn, dashboardBtn);
        
        newBtn.innerHTML = '🏠 Dashboard';
        newBtn.style.background = '#28a745';
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔧 Fallback dashboard button clicked!');
            window.location.href = 'index.html';
        });
    }
}

// =========================
// GROUP CHAT FUNCTIONALITY
// =========================

// Setup tab switching functionality
function setupTabSwitching() {
    const individualTab = document.getElementById('individualTab');
    const groupTab = document.getElementById('groupTab');
    
    if (individualTab && groupTab) {
        individualTab.addEventListener('click', () => {
            currentTab = 'individual';
            individualTab.classList.add('active');
            groupTab.classList.remove('active');
            showIndividualChats();
        });
        
        groupTab.addEventListener('click', () => {
            currentTab = 'group';
            groupTab.classList.add('active');
            individualTab.classList.remove('active');
            showGroupChats();
        });
    }
}

// Setup group chat functionality
function setupGroupChatFunctionality() {
    const createGroupBtn = document.getElementById('createGroupBtn');
    const groupChatForm = document.getElementById('groupChatForm');
    const participantSearch = document.getElementById('participantSearch');
    
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', openGroupChatModal);
    }
    
    if (groupChatForm) {
        groupChatForm.addEventListener('submit', handleGroupChatCreation);
    }
    
    if (participantSearch) {
        participantSearch.addEventListener('input', handleParticipantSearch);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('groupChatModal');
        if (e.target === modal) {
            closeGroupChatModal();
        }
    });
}

// Open group chat creation modal
function openGroupChatModal() {
    const modal = document.getElementById('groupChatModal');
    if (modal) {
        modal.style.display = 'block';
        selectedParticipants.clear();
        updateSelectedParticipantsList();
        
        // Clear form
        document.getElementById('groupName').value = '';
        document.getElementById('groupDescription').value = '';
        document.getElementById('participantSearch').value = '';
        document.getElementById('participantSearchResults').innerHTML = '';
    }
}

// Close group chat creation modal
function closeGroupChatModal() {
    const modal = document.getElementById('groupChatModal');
    if (modal) {
        modal.style.display = 'none';
        selectedParticipants.clear();
    }
}

// Handle participant search
let participantSearchTimeout = null;
function handleParticipantSearch(e) {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('participantSearchResults');
    
    // Clear previous timeout
    if (participantSearchTimeout) {
        clearTimeout(participantSearchTimeout);
    }
    
    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    // Debounce search
    participantSearchTimeout = setTimeout(() => {
        searchParticipants(query);
    }, 300);
}

// Search for participants
async function searchParticipants(query) {
    try {
        let headers = {};
        if (window.isBusinessUser) {
            const business = JSON.parse(localStorage.getItem('businessInfo'));
            headers['X-Business-Id'] = business.id;
            headers['X-Business-Email'] = business.email;
        } else {
            const token = localStorage.getItem('authToken');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_BASE}/api/auth/users/search?query=${encodeURIComponent(query)}`, { headers });
        if (response.ok) {
            const users = await response.json();
            displayParticipantSearchResults(users);
        }
    } catch (error) {
        console.error('❌ Error searching participants:', error);
    }
}

// Display participant search results
function displayParticipantSearchResults(users) {
    const resultsContainer = document.getElementById('participantSearchResults');
    resultsContainer.innerHTML = '';
    
    if (users.length === 0) {
        resultsContainer.innerHTML = '<div style="padding: 10px; color: #666;">No users found</div>';
        return;
    }
    
    users.forEach(user => {
        // Skip current user and already selected participants
        if (user.id === currentUserId || selectedParticipants.has(user.id)) {
            return;
        }
        
        const userItem = document.createElement('div');
        userItem.style.cssText = `
            padding: 10px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        userItem.innerHTML = `
            <div>
                <strong>${user.name}</strong>
                <div style="font-size: 12px; color: #666;">${user.email}</div>
            </div>
            <button style="background: #007bff; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">Add</button>
        `;
        
        userItem.querySelector('button').addEventListener('click', () => {
            addParticipant(user);
        });
        
        resultsContainer.appendChild(userItem);
    });
}

// Add participant to group
function addParticipant(user) {
    selectedParticipants.set(user.id, user);
    updateSelectedParticipantsList();
    
    // Clear search
    document.getElementById('participantSearch').value = '';
    document.getElementById('participantSearchResults').innerHTML = '';
}

// Update selected participants list
function updateSelectedParticipantsList() {
    const container = document.getElementById('selectedParticipants');
    
    if (selectedParticipants.size === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No participants selected</div>';
        return;
    }
    
    container.innerHTML = '';
    selectedParticipants.forEach((user, userId) => {
        const participantItem = document.createElement('div');
        participantItem.className = 'participant-item';
        participantItem.innerHTML = `
            <div>
                <strong>${user.name}</strong>
                <div style="font-size: 12px; color: #666;">${user.email}</div>
            </div>
            <button class="participant-remove" onclick="removeParticipant('${userId}')">Remove</button>
        `;
        container.appendChild(participantItem);
    });
}

// Remove participant from group
function removeParticipant(userId) {
    selectedParticipants.delete(userId);
    updateSelectedParticipantsList();
}

// Handle group chat creation
async function handleGroupChatCreation(e) {
    e.preventDefault();
    
    const groupName = document.getElementById('groupName').value.trim();
    const groupDescription = document.getElementById('groupDescription').value.trim();
    
    if (!groupName) {
        alert('Please enter a group name');
        return;
    }
    
    if (selectedParticipants.size === 0) {
        alert('Please add at least one participant');
        return;
    }
    
    try {
        let headers = { 'Content-Type': 'application/json' };
        if (window.isBusinessUser) {
            const business = JSON.parse(localStorage.getItem('businessInfo'));
            headers['X-Business-Id'] = business.id;
            headers['X-Business-Email'] = business.email;
        } else {
            const token = localStorage.getItem('authToken');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const participantEmails = Array.from(selectedParticipants.values()).map(user => user.email);
        const response = await fetch(`${API_BASE}/api/groupchat/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: groupName,
                description: groupDescription,
                participantEmails: participantEmails
            })
        });
        if (response.ok) {
            const groupChat = await response.json();
            console.log('✅ Group chat created:', groupChat);
            closeGroupChatModal();
            await loadGroupChats();
            currentTab = 'group';
            document.getElementById('groupTab').classList.add('active');
            document.getElementById('individualTab').classList.remove('active');
            showGroupChats();
            openChat(groupChat.id, groupChat.name, 'GROUP');
        } else {
            const error = await response.json();
            alert('Error creating group chat: ' + (error.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Error creating group chat:', error);
        alert('Error creating group chat: ' + error.message);
    }
}
