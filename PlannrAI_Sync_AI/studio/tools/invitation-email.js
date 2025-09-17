// Event Invitation Email Tool JavaScript

class InvitationEmailTool {
    constructor() {
        this.chatHistory = [];
        this.generatedContent = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadStoredData();
    }

    initializeElements() {
        // Form elements
        this.eventNameInput = document.getElementById('eventName');
        this.eventDateInput = document.getElementById('eventDate');
        this.eventDetailsInput = document.getElementById('eventDetails');
        this.toneSelect = document.getElementById('tone');
        this.languageSelect = document.getElementById('language');
        this.customInstructionsInput = document.getElementById('customInstructions');
        
        // Action buttons
        this.generateBtn = document.getElementById('generateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.exportBtn = document.getElementById('exportBtn');
        
        // Chat elements
        this.chatContainer = document.getElementById('chatContainer');
        this.chatForm = document.getElementById('chatForm');
        this.chatInput = document.getElementById('chatInput');
        this.chatSendBtn = document.getElementById('chatSendBtn');
    }

    bindEvents() {
        // Form events
        this.generateBtn.addEventListener('click', () => this.generateEmail());
        this.clearBtn.addEventListener('click', () => this.clearForm());
        
        // Action buttons
        this.copyBtn.addEventListener('click', () => this.copyContent());
        this.downloadBtn.addEventListener('click', () => this.downloadContent());
        this.exportBtn.addEventListener('click', () => this.exportContent());
        
        // Chat events
        this.chatForm.addEventListener('submit', (e) => this.sendChatMessage(e));
        
        // Auto-save form data
        [this.eventNameInput, this.eventDateInput, this.eventDetailsInput, 
         this.customInstructionsInput].forEach(input => {
            input.addEventListener('input', () => this.saveFormData());
        });
        
        [this.toneSelect, this.languageSelect].forEach(select => {
            select.addEventListener('change', () => this.saveFormData());
        });
    }

    loadStoredData() {
        const stored = localStorage.getItem('invitation_email_form');
        if (stored) {
            const data = JSON.parse(stored);
            this.eventNameInput.value = data.eventName || '';
            this.eventDateInput.value = data.eventDate || '';
            this.eventDetailsInput.value = data.eventDetails || '';
            this.toneSelect.value = data.tone || 'professional';
            this.languageSelect.value = data.language || 'english';
            this.customInstructionsInput.value = data.customInstructions || '';
        }

        // Load chat history from sessionStorage (non-persistent)
        const chatStored = sessionStorage.getItem('studio_tool_chat');
        if (chatStored) {
            this.chatHistory = JSON.parse(chatStored);
            this.displayChatHistory();
        }
    }

    saveFormData() {
        const formData = {
            eventName: this.eventNameInput.value,
            eventDate: this.eventDateInput.value,
            eventDetails: this.eventDetailsInput.value,
            tone: this.toneSelect.value,
            language: this.languageSelect.value,
            customInstructions: this.customInstructionsInput.value
        };
        localStorage.setItem('invitation_email_form', JSON.stringify(formData));
    }

    saveChatHistory() {
        sessionStorage.setItem('studio_tool_chat', JSON.stringify(this.chatHistory));
    }

    async generateEmail() {
        // Validate required fields
        if (!this.eventNameInput.value.trim()) {
            this.showToast('Please enter an event name', 'error');
            this.eventNameInput.focus();
            return;
        }

        // Show loading state
        this.setGeneratingState(true);

        // Build natural language prompt from form data
        const prompt = this.buildPromptFromForm();
        
        // Clear previous chat and auto-send the prompt
        this.clearChat();
        await this.sendChatMessage(prompt, true); // true = auto-generated
    }

    buildPromptFromForm() {
        const eventName = this.eventNameInput.value.trim();
        const eventDate = this.eventDateInput.value.trim();
        const eventDetails = this.eventDetailsInput.value.trim();
        const tone = this.toneSelect.value;
        const language = this.languageSelect.value;
        const customInstructions = this.customInstructionsInput.value.trim();

        let prompt = `Create an email invitation for "${eventName}"`;
        
        if (eventDate) {
            prompt += ` scheduled for ${eventDate}`;
        }
        
        prompt += `. Make it ${tone} in tone`;
        
        if (language !== 'english') {
            prompt += ` and write it in ${language}`;
        }
        
        if (eventDetails) {
            prompt += `.\n\nEvent details: ${eventDetails}`;
        }
        
        if (customInstructions) {
            prompt += `.\n\nAdditional instructions: ${customInstructions}`;
        }
        
        prompt += `.\n\nPlease create a complete, professional email invitation that I can send to invitees.`;
        
        return prompt;
    }

    async sendChatMessage(e, isAutoGenerated = false) {
        let message;
        
        if (isAutoGenerated) {
            // e is the message itself when auto-generated
            message = e;
        } else {
            // Normal form submission
            e.preventDefault();
            message = this.chatInput.value.trim();
            if (!message) return;
            this.chatInput.value = '';
        }

        // Add user message to chat (only if not auto-generated)
        if (!isAutoGenerated) {
            this.addUserMessage(message);
        }

        // Add to chat history
        this.chatHistory.push({ role: 'user', content: message });

        // Show typing indicator
        this.addTypingIndicator();

        try {
            // Make API call to existing /ask endpoint
            const response = await fetch('/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: message,
                    chat_history: this.chatHistory.slice(-10) // Send last 10 messages
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add bot response
            this.addBotMessage(result.answer);
            
            // Store generated content for first response
            if (isAutoGenerated) {
                this.generatedContent = result.answer;
                this.enableChatMode();
                this.saveToActivity();
            }
            
            // Update chat history
            this.chatHistory.push({ role: 'assistant', content: result.answer });
            this.saveChatHistory();

        } catch (error) {
            console.error('Error in chat:', error);
            this.removeTypingIndicator();
            this.addBotMessage('Sorry, there was an error processing your message. Please try again.', 'error');
        }

        // Set generating state
        if (isAutoGenerated) {
            this.setGeneratingState(false);
        }
    }

    addBotMessage(content, type = 'normal') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bot-message';
        
        const messageClass = type === 'error' ? 'error-message' : '';
        
        messageDiv.innerHTML = `
            <span class="message-icon">🤖</span>
            <div class="message-content ${messageClass}">
                <p>${this.formatMessage(content)}</p>
            </div>
        `;
        
        // Remove welcome message if it exists
        const welcomeMessage = this.chatContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addUserMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        
        messageDiv.innerHTML = `
            <span class="message-icon">👤</span>
            <div class="message-content">
                <p>${this.escapeHtml(content)}</p>
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <span class="message-icon">🤖</span>
            <div class="message-content">
                <div class="typing-indicator">
                    <span>Generating</span>
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    formatMessage(content) {
        // Convert line breaks and format content
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    displayChatHistory() {
        this.chatHistory.forEach(msg => {
            if (msg.role === 'user') {
                this.addUserMessage(msg.content);
            } else {
                this.addBotMessage(msg.content);
            }
        });
        
        if (this.chatHistory.length > 0) {
            this.enableChatMode();
        }
    }

    setGeneratingState(isGenerating) {
        this.generateBtn.disabled = isGenerating;
        this.generateBtn.textContent = isGenerating ? '🔄 Generating...' : '🤖 Generate Email';
        
        if (isGenerating) {
            this.generateBtn.classList.add('loading');
        } else {
            this.generateBtn.classList.remove('loading');
        }
    }

    enableChatMode() {
        this.chatInput.disabled = false;
        this.chatSendBtn.disabled = false;
        this.copyBtn.disabled = false;
        this.downloadBtn.disabled = false;
        this.exportBtn.disabled = false;
        
        this.chatInput.placeholder = 'Ask me to modify the email...';
        this.chatInput.focus();
    }

    clearChat() {
        // Clear chat history
        this.chatHistory = [];
        this.generatedContent = null;
        
        // Reset chat container
        this.chatContainer.innerHTML = `
            <div class="welcome-message">
                <div class="bot-message">
                    <span class="message-icon">🤖</span>
                    <div class="message-content">
                        <p>👋 Welcome! Fill out the form above and click "Generate Email" to create your invitation. Then you can chat with me to refine it!</p>
                    </div>
                </div>
            </div>
        `;
        
        // Disable chat and action buttons
        this.chatInput.disabled = true;
        this.chatSendBtn.disabled = true;
        this.copyBtn.disabled = true;
        this.downloadBtn.disabled = true;
        this.exportBtn.disabled = true;
        this.chatInput.placeholder = 'Generate an email first...';
        
        // Clear session storage
        sessionStorage.removeItem('studio_tool_chat');
    }

    clearForm() {
        // Clear form inputs
        this.eventNameInput.value = '';
        this.eventDateInput.value = '';
        this.eventDetailsInput.value = '';
        this.toneSelect.value = 'professional';
        this.languageSelect.value = 'english';
        this.customInstructionsInput.value = '';
        
        // Clear chat
        this.clearChat();
        
        // Clear stored form data
        localStorage.removeItem('invitation_email_form');
        
        this.showToast('Form cleared!', 'success');
    }

    copyContent() {
        if (!this.generatedContent) return;
        
        navigator.clipboard.writeText(this.generatedContent).then(() => {
            this.showToast('Email copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy content', 'error');
        });
    }

    downloadContent() {
        if (!this.generatedContent) return;
        
        const blob = new Blob([this.generatedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.eventNameInput.value || 'event'}_invitation.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Email downloaded!', 'success');
    }

    exportContent() {
        if (!this.generatedContent) return;
        
        // Create a more formatted version
        const formattedContent = `
EVENT INVITATION EMAIL
Generated by PlannrAI Sync Studio
${new Date().toLocaleString()}

${this.generatedContent}

---
Form Details:
Event: ${this.eventNameInput.value}
Date: ${this.eventDateInput.value}
Tone: ${this.toneSelect.value}
Language: ${this.languageSelect.value}
        `.trim();
        
        const blob = new Blob([formattedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.eventNameInput.value || 'event'}_invitation_detailed.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Detailed export downloaded!', 'success');
    }

    saveToActivity() {
        // Save to recent activity for the main studio dashboard
        const activity = {
            id: Date.now().toString(),
            toolName: 'invitation-email',
            title: `${this.eventNameInput.value} Invitation`,
            content: this.generatedContent,
            icon: '📧',
            timeAgo: 'Just now',
            timestamp: new Date().toISOString()
        };

        const recentActivity = JSON.parse(localStorage.getItem('plannrai_recent_activity') || '[]');
        recentActivity.unshift(activity);
        
        // Keep only last 10 activities
        if (recentActivity.length > 10) {
            recentActivity.pop();
        }

        localStorage.setItem('plannrai_recent_activity', JSON.stringify(recentActivity));
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1001;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize the tool when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.invitationEmailTool = new InvitationEmailTool();
});

// Add some entrance animations
window.addEventListener('load', () => {
    const sections = document.querySelectorAll('.input-section, .chat-section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            section.style.transition = 'all 0.6s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 200);
    });
});
