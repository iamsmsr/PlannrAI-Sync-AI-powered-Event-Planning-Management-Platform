// Event Name Generator Tool JavaScript

class EventNameTool {
    constructor() {
        this.chatHistory = [];
        this.generatedContent = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadStoredData();
    }

    initializeElements() {
        // Form elements
        this.eventTypeSelect = document.getElementById('eventType');
        this.industryInput = document.getElementById('industry');
        this.targetAudienceInput = document.getElementById('targetAudience');
        this.eventToneSelect = document.getElementById('eventTone');
        this.eventThemeInput = document.getElementById('eventTheme');
        this.locationSelect = document.getElementById('location');
        this.keyWordsInput = document.getElementById('keyWords');
        this.avoidWordsInput = document.getElementById('avoidWords');
        this.nameLengthSelect = document.getElementById('nameLength');
        this.nameCountSelect = document.getElementById('nameCount');
        this.additionalInfoInput = document.getElementById('additionalInfo');
        
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
        this.generateBtn.addEventListener('click', () => this.generateNames());
        this.clearBtn.addEventListener('click', () => this.clearForm());
        
        // Action buttons
        this.copyBtn.addEventListener('click', () => this.copyContent());
        this.downloadBtn.addEventListener('click', () => this.downloadContent());
        this.exportBtn.addEventListener('click', () => this.exportContent());
        
        // Chat events
        this.chatForm.addEventListener('submit', (e) => this.sendChatMessage(e));
        
        // Auto-save form data
        [this.eventTypeSelect, this.industryInput, this.targetAudienceInput, this.eventToneSelect,
         this.eventThemeInput, this.locationSelect, this.keyWordsInput, this.avoidWordsInput,
         this.nameLengthSelect, this.nameCountSelect, this.additionalInfoInput].forEach(input => {
            const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
            input.addEventListener(eventType, () => this.saveFormData());
        });
    }

    loadStoredData() {
        const stored = localStorage.getItem('event_name_form');
        if (stored) {
            const data = JSON.parse(stored);
            this.eventTypeSelect.value = data.eventType || '';
            this.industryInput.value = data.industry || '';
            this.targetAudienceInput.value = data.targetAudience || '';
            this.eventToneSelect.value = data.eventTone || '';
            this.eventThemeInput.value = data.eventTheme || '';
            this.locationSelect.value = data.location || '';
            this.keyWordsInput.value = data.keyWords || '';
            this.avoidWordsInput.value = data.avoidWords || '';
            this.nameLengthSelect.value = data.nameLength || '';
            this.nameCountSelect.value = data.nameCount || '10';
            this.additionalInfoInput.value = data.additionalInfo || '';
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
            eventType: this.eventTypeSelect.value,
            industry: this.industryInput.value,
            targetAudience: this.targetAudienceInput.value,
            eventTone: this.eventToneSelect.value,
            eventTheme: this.eventThemeInput.value,
            location: this.locationSelect.value,
            keyWords: this.keyWordsInput.value,
            avoidWords: this.avoidWordsInput.value,
            nameLength: this.nameLengthSelect.value,
            nameCount: this.nameCountSelect.value,
            additionalInfo: this.additionalInfoInput.value
        };
        localStorage.setItem('event_name_form', JSON.stringify(formData));
    }

    saveChatHistory() {
        sessionStorage.setItem('studio_tool_chat', JSON.stringify(this.chatHistory));
    }

    async generateNames() {
        // Validate required fields
        if (!this.eventTypeSelect.value.trim()) {
            this.showToast('Please select an event type', 'error');
            this.eventTypeSelect.focus();
            return;
        }

        if (!this.targetAudienceInput.value.trim()) {
            this.showToast('Please specify your target audience', 'error');
            this.targetAudienceInput.focus();
            return;
        }

        if (!this.eventToneSelect.value.trim()) {
            this.showToast('Please select an event tone/style', 'error');
            this.eventToneSelect.focus();
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
        const eventType = this.eventTypeSelect.value;
        const industry = this.industryInput.value.trim();
        const targetAudience = this.targetAudienceInput.value.trim();
        const eventTone = this.eventToneSelect.value;
        const eventTheme = this.eventThemeInput.value.trim();
        const location = this.locationSelect.value;
        const keyWords = this.keyWordsInput.value.trim();
        const avoidWords = this.avoidWordsInput.value.trim();
        const nameLength = this.nameLengthSelect.value;
        const nameCount = this.nameCountSelect.value || '10';
        const additionalInfo = this.additionalInfoInput.value.trim();

        let prompt = `Generate ${nameCount} creative and catchy names for a ${eventType}`;
        
        if (industry) {
            prompt += ` in the ${industry} industry`;
        }
        
        prompt += ` targeting ${targetAudience}. The event tone should be ${eventTone}.`;
        
        if (eventTheme) {
            prompt += ` The theme/purpose is: ${eventTheme}.`;
        }
        
        if (location) {
            const locationMap = {
                'dhaka': 'Dhaka, Bangladesh',
                'chittagong': 'Chittagong, Bangladesh', 
                'sylhet': 'Sylhet, Bangladesh',
                'bangladesh': 'Bangladesh',
                'south-asia': 'South Asia',
                'international': 'International',
                'virtual': 'Virtual/Online'
            };
            prompt += ` This is for ${locationMap[location] || location}.`;
        }
        
        if (keyWords) {
            prompt += ` Please include or consider these keywords: ${keyWords}.`;
        }
        
        if (avoidWords) {
            prompt += ` Avoid using these words: ${avoidWords}.`;
        }
        
        if (nameLength) {
            const lengthMap = {
                'short': 'short (1-2 words)',
                'medium': 'medium length (2-3 words)',
                'long': 'longer (3-4 words)',
                'descriptive': 'descriptive (4+ words)'
            };
            prompt += ` Prefer ${lengthMap[nameLength]} names.`;
        }
        
        if (additionalInfo) {
            prompt += ` Additional requirements: ${additionalInfo}`;
        }
        
        prompt += `\n\nPlease provide:
1. A numbered list of ${nameCount} creative event name suggestions
2. Brief explanation for each name (why it works)
3. Different style variations (some modern, some traditional, some creative)
4. Consider cultural appropriateness for the location
5. Ensure names are memorable and relevant to the event purpose

Format the response clearly with each name on a separate line with its explanation.`;
        
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
                    <span>Generating creative names</span>
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
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/(\d+\.\s)/g, '<br><strong>$1</strong>');
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
        this.generateBtn.textContent = isGenerating ? '🔄 Generating Names...' : '🎪 Generate Event Names';
        
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
        
        this.chatInput.placeholder = 'Ask me to generate more names or modify the suggestions...';
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
                        <p>👋 Welcome! Fill out the event details above and click "Generate Event Names" to get creative name suggestions. Then you can chat with me to refine or generate more options!</p>
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
        this.chatInput.placeholder = 'Generate names first...';
        
        // Clear session storage
        sessionStorage.removeItem('studio_tool_chat');
    }

    clearForm() {
        // Clear form inputs
        this.eventTypeSelect.value = '';
        this.industryInput.value = '';
        this.targetAudienceInput.value = '';
        this.eventToneSelect.value = '';
        this.eventThemeInput.value = '';
        this.locationSelect.value = '';
        this.keyWordsInput.value = '';
        this.avoidWordsInput.value = '';
        this.nameLengthSelect.value = '';
        this.nameCountSelect.value = '10';
        this.additionalInfoInput.value = '';
        
        // Clear chat
        this.clearChat();
        
        // Clear stored form data
        localStorage.removeItem('event_name_form');
        
        this.showToast('Form cleared!', 'success');
    }

    copyContent() {
        if (!this.generatedContent) return;
        
        navigator.clipboard.writeText(this.generatedContent).then(() => {
            this.showToast('Event names copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy content', 'error');
        });
    }

    downloadContent() {
        if (!this.generatedContent) return;
        
        const eventType = this.eventTypeSelect.value || 'event';
        const blob = new Blob([this.generatedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${eventType}_name_suggestions.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Event names downloaded!', 'success');
    }

    exportContent() {
        if (!this.generatedContent) return;
        
        // Create a more formatted version
        const eventType = this.eventTypeSelect.value;
        const targetAudience = this.targetAudienceInput.value;
        const eventTone = this.eventToneSelect.value;
        
        const formattedContent = `
EVENT NAME SUGGESTIONS
Generated by PlannrAI Sync Studio
${new Date().toLocaleString()}

Event Type: ${eventType}
Target Audience: ${targetAudience}
Tone/Style: ${eventTone}
Theme: ${this.eventThemeInput.value}
Industry: ${this.industryInput.value}

${this.generatedContent}

---
Generation Parameters:
Event Type: ${eventType}
Industry: ${this.industryInput.value}
Target Audience: ${targetAudience}
Event Tone: ${eventTone}
Theme: ${this.eventThemeInput.value}
Location: ${this.locationSelect.value}
Keywords: ${this.keyWordsInput.value}
Avoid Words: ${this.avoidWordsInput.value}
Name Length: ${this.nameLengthSelect.value}
Count: ${this.nameCountSelect.value}
Additional Info: ${this.additionalInfoInput.value}
        `.trim();
        
        const blob = new Blob([formattedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${eventType}_name_suggestions_detailed.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Detailed name list exported!', 'success');
    }

    saveToActivity() {
        // Save to recent activity for the main studio dashboard
        const eventType = this.eventTypeSelect.value;
        const nameCount = this.nameCountSelect.value;
        
        const activity = {
            id: Date.now().toString(),
            toolName: 'event-name',
            title: `${eventType} Name Ideas`,
            content: this.generatedContent,
            icon: '🎪',
            timeAgo: 'Just now',
            timestamp: new Date().toISOString(),
            details: `${nameCount} suggestions • ${this.eventToneSelect.value} style`
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
    window.eventNameTool = new EventNameTool();
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
