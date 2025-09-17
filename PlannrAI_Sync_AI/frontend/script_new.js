// PlannrAI Sync - Clean JavaScript Implementation
const chat = document.getElementById('chat');
const form = document.getElementById('chat-form');
const questionInput = document.getElementById('question');
let currentLanguage = 'en';
let chatHistory = [];

// FAQ Data Structure
const faqData = {
    venue: {
        title: { en: "🏢 Venue Related Questions", bn: "🏢 ভেন্যু সংক্রান্ত প্রশ্নাবলী" },
        questions: [
            { en: "How do I search for venues in Dhaka?", bn: "ঢাকায় ভেন্যু খোঁজার উপায় কী?" },
            { en: "What is the price range for wedding venues?", bn: "বিয়ের ভেন্যুর দাম কত?" },
            { en: "Which venues are best for corporate events?", bn: "কর্পোরেট ইভেন্টের জন্য কোন ভেন্যু ভালো?" },
            { en: "Do venues provide catering services?", bn: "ভেন্যুতে কি খাবারের ব্যবস্থা আছে?" },
            { en: "Can I visit venues before booking?", bn: "বুকিং এর আগে কি ভেন্যু দেখতে পারি?" }
        ]
    },
    vendor: {
        title: { en: "🛍️ Vendor Services Questions", bn: "🛍️ ভেন্ডর সেবা সংক্রান্ত প্রশ্নাবলী" },
        questions: [
            { en: "How do I find reliable photographers?", bn: "ভালো ফটোগ্রাফার কীভাবে পাবো?" },
            { en: "What catering options are available?", bn: "কী ধরনের খাবারের ব্যবস্থা পাওয়া যায়?" },
            { en: "How much do decoration services cost?", bn: "সাজসজ্জার খরচ কত?" },
            { en: "Can vendors provide Bengali traditional themes?", bn: "বাংলা ঐতিহ্যবাহী থিম করতে পারেন?" },
            { en: "How do I check vendor reviews and ratings?", bn: "ভেন্ডরের রিভিউ ও রেটিং কীভাবে দেখবো?" }
        ]
    },
    platform: {
        title: { en: "💻 Platform Usage Questions", bn: "💻 প্ল্যাটফর্ম ব্যবহার সংক্রান্ত প্রশ্নাবলী" },
        questions: [
            { en: "How do I create an account on PlannrAI Sync?", bn: "PlannrAI Sync এ একাউন্ট কীভাবে তৈরি করবো?" },
            { en: "Can I collaborate with others on event planning?", bn: "অন্যদের সাথে মিলে ইভেন্ট প্ল্যান করতে পারি?" },
            { en: "How does the AI assistant help with planning?", bn: "AI সহায়ক কীভাবে পরিকল্পনায় সাহায্য করে?" },
            { en: "Is the platform available in Bengali?", bn: "প্ল্যাটফর্মটি কি বাংলায় পাওয়া যায়?" },
            { en: "How do I use the interactive map feature?", bn: "ইন্টারেক্টিভ ম্যাপ কীভাবে ব্যবহার করবো?" }
        ]
    },
    booking: {
        title: { en: "💳 Booking & Payment Questions", bn: "💳 বুকিং ও পেমেন্ট সংক্রান্ত প্রশ্নাবলী" },
        questions: [
            { en: "What payment methods are accepted?", bn: "কী কী পেমেন্ট পদ্ধতি গ্রহণ করা হয়?" },
            { en: "Can I cancel my booking?", bn: "বুকিং বাতিল করতে পারি?" },
            { en: "How do I confirm my venue booking?", bn: "ভেন্যু বুকিং কনফার্ম কীভাবে করবো?" },
            { en: "Is advance payment required?", bn: "আগাম টাকা দিতে হয়?" },
            { en: "Can I book multiple vendors at once?", bn: "একসাথে অনেক ভেন্ডর বুক করতে পারি?" }
        ]
    },
    support: {
        title: { en: "🆘 Support & Help Questions", bn: "🆘 সহায়তা ও সাপোর্ট সংক্রান্ত প্রশ্নাবলী" },
        questions: [
            { en: "How do I contact customer support?", bn: "কাস্টমার সাপোর্টের সাথে যোগাযোগ কীভাবে?" },
            { en: "What if I have issues with a vendor?", bn: "ভেন্ডর নিয়ে সমস্যা হলে কী করবো?" },
            { en: "How do I report a problem?", bn: "সমস্যা রিপোর্ট কীভাবে করবো?" },
            { en: "Is there a mobile app available?", bn: "মোবাইল অ্যাপ পাওয়া যায়?" },
            { en: "How do I leave reviews for vendors?", bn: "ভেন্ডরদের রিভিউ কীভাবে দেবো?" }
        ]
    }
};

// DOM Elements
const categorySelection = document.getElementById('category-selection');
const questionsContainer = document.getElementById('questions-container');
const categoryTitle = document.getElementById('category-title');
const questionsList = document.getElementById('questions-list');
const backButton = document.getElementById('back-to-categories');
const langEnBtn = document.getElementById('lang-en');
const langBnBtn = document.getElementById('lang-bn');

// Chat History Management
function loadChatHistory() {
    const saved = localStorage.getItem('plannrai_chat_history');
    if (saved) {
        try {
            chatHistory = JSON.parse(saved);
            chatHistory.forEach(msg => {
                appendMessage(msg.role === 'user' ? 'user' : 'bot', msg.content);
            });
        } catch (e) {
            console.error('Error loading chat history:', e);
            chatHistory = [];
        }
    }
}

function saveChatHistory() {
    try {
        localStorage.setItem('plannrai_chat_history', JSON.stringify(chatHistory));
    } catch (e) {
        console.error('Error saving chat history:', e);
    }
}

// Language Management
function switchLanguage(lang) {
    currentLanguage = lang;
    
    // Update button states
    langEnBtn.classList.toggle('active', lang === 'en');
    langBnBtn.classList.toggle('active', lang === 'bn');
    
    // Update placeholder
    questionInput.placeholder = lang === 'en' 
        ? "Ask about venues, vendors, bookings (English or বাংলা)..."
        : "ভেন্যু, ভেন্ডর, বুকিং সম্পর্কে জিজ্ঞাসা করুন...";

    updateLanguageContent();
}

function updateLanguageContent() {
    document.querySelectorAll('[data-en][data-bn]').forEach(element => {
        const text = element.getAttribute(`data-${currentLanguage}`);
        if (text) {
            element.textContent = text;
        }
    });

    // Update questions if currently shown
    const currentCategory = questionsContainer.dataset.currentCategory;
    if (currentCategory && questionsContainer.style.display !== 'none') {
        showQuestions(currentCategory);
    }
}

// FAQ Management
function showQuestions(category) {
    const data = faqData[category];
    if (!data) return;

    categorySelection.style.display = 'none';
    questionsContainer.style.display = 'block';
    questionsContainer.dataset.currentCategory = category;

    categoryTitle.textContent = data.title[currentLanguage];

    questionsList.innerHTML = '';
    data.questions.forEach(q => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'faq-question';
        questionDiv.textContent = q[currentLanguage];
        questionDiv.style.cursor = 'pointer';
        
        questionDiv.addEventListener('click', function(e) {
            e.preventDefault();
            handleQuestionClick(q[currentLanguage], this);
        });
        
        questionsList.appendChild(questionDiv);
    });
}

function backToCategories() {
    categorySelection.style.display = 'block';
    questionsContainer.style.display = 'none';
    delete questionsContainer.dataset.currentCategory;
}

// Question Handling
async function handleQuestionClick(question, element) {
    console.log('FAQ Question clicked:', question);
    
    // Visual feedback
    element.style.background = '#007bff';
    element.style.color = 'white';
    setTimeout(() => {
        element.style.background = '';
        element.style.color = '';
    }, 300);

    // Send the question
    await sendMessage(question);
}

// Core Chat Functions
async function sendMessage(message) {
    if (!message || !message.trim()) return;
    
    const question = message.trim();
    console.log('Sending message:', question);
    
    // Add user message
    appendMessage('user', question);
    chatHistory.push({ role: 'user', content: question });
    
    // Show typing indicator
    const typingDiv = createTypingIndicator();
    
    try {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                chat_history: chatHistory.slice(-10)
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received response:', data);
        
        // Remove typing indicator and show response
        removeTypingIndicator(typingDiv);
        appendMessage('bot', data.answer);
        chatHistory.push({ role: 'assistant', content: data.answer });
        
        saveChatHistory();
        
    } catch (error) {
        console.error('Error sending message:', error);
        removeTypingIndicator(typingDiv);
        appendMessage('bot', 'Sorry, I encountered an error. Please try again.');
    }
}

function createTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot typing';
    typingDiv.innerHTML = 'PlannrAI: <em>Typing...</em>';
    chat.appendChild(typingDiv);
    chat.scrollTop = chat.scrollHeight;
    return typingDiv;
}

function removeTypingIndicator(typingDiv) {
    if (typingDiv && chat.contains(typingDiv)) {
        chat.removeChild(typingDiv);
    }
}

// Message Display
function formatBotText(text) {
    // Handle numbered lists
    if (/\d+\.\s/.test(text)) {
        const lines = text.split(/\n/);
        let listItems = '';
        let isList = false;
        lines.forEach(line => {
            const match = line.match(/^\d+\.\s*(.*)/);
            if (match) {
                listItems += `<li>${match[1]}</li>`;
                isList = true;
            } else if (line.trim()) {
                listItems += `<br>${line}`;
            }
        });
        if (isList) return `<ol>${listItems}</ol>`;
    }
    
    // Handle bullet lists
    if (/\*\s/.test(text)) {
        const lines = text.split(/\n/);
        let listItems = '';
        let isList = false;
        lines.forEach(line => {
            const match = line.match(/^\*\s*(.*)/);
            if (match) {
                listItems += `<li>${match[1]}</li>`;
                isList = true;
            } else if (line.trim()) {
                listItems += `<br>${line}`;
            }
        });
        if (isList) return `<ul>${listItems}</ul>`;
    }
    
    return text.replace(/\n/g, '<br>');
}

function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = sender;
    
    if (sender === 'bot') {
        div.innerHTML = 'PlannrAI: ' + formatBotText(text);
    } else {
        div.innerHTML = 'You: ' + text.replace(/\n/g, '<br>');
    }
    
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

// Event Listeners
function initializeEventListeners() {
    // Language toggle
    langEnBtn.addEventListener('click', () => switchLanguage('en'));
    langBnBtn.addEventListener('click', () => switchLanguage('bn'));
    
    // Back button
    backButton.addEventListener('click', backToCategories);
    
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            showQuestions(category);
        });
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = questionInput.value.trim();
        if (question) {
            questionInput.value = '';
            await sendMessage(question);
        }
    });
}

// Initialize Application
function initializeApp() {
    console.log('Initializing PlannrAI Sync...');
    
    // Set default language
    switchLanguage('en');
    
    // Load chat history
    loadChatHistory();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Show welcome message if no chat history
    if (chatHistory.length === 0) {
        setTimeout(() => {
            appendMessage('bot', 'Welcome to PlannrAI Sync! 🎉\n\nI\'m your AI assistant for event planning in Dhaka. Select a category above to see common questions, or type your own question.\n\nI can help you with:\n• Venues and pricing 🏢\n• Vendor services 🛍️\n• Platform usage 💻\n• Booking procedures 💳\n• Support & help 🆘\n\nI speak both English and বাংলা! 😊');
        }, 500);
    }
    
    console.log('PlannrAI Sync initialized successfully!');
}

// Listen for parent postMessage to clear chat history
window.addEventListener('message', (event) => {
  // Optionally validate event.origin for security
  // if (event.origin !== 'https://your-app-origin.example') return;
  try {
    const msg = event.data;
    if (msg && msg.type === 'plannrai_clear_history') {
      localStorage.removeItem('plannrai_chat_history');
      // Optionally notify parent that clear succeeded:
      if (event.source && typeof event.source.postMessage === 'function') {
        event.source.postMessage({ type: 'plannrai_clear_history_done' }, event.origin || '*');
      }
    }
  } catch (err) {
    console.warn('Error handling plannrai_clear_history message', err);
  }
});

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}