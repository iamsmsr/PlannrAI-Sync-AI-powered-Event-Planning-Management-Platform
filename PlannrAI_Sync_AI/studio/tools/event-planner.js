// Event Planner & Timeline Tool JavaScript

class EventPlannerTool {
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
        this.eventDateInput = document.getElementById('eventDate');
        this.eventTimeInput = document.getElementById('eventTime');
        this.guestCountInput = document.getElementById('guestCount');
        this.budgetRangeSelect = document.getElementById('budgetRange');
        this.venueTypeSelect = document.getElementById('venueType');
        this.planningTimeSelect = document.getElementById('planningTime');
        this.locationInput = document.getElementById('location');
        this.prioritiesInput = document.getElementById('priorities');
        this.specialRequestsInput = document.getElementById('specialRequests');
        
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
        this.generateBtn.addEventListener('click', () => this.generatePlan());
        this.clearBtn.addEventListener('click', () => this.clearForm());
        
        // Action buttons
        this.copyBtn.addEventListener('click', () => this.copyContent());
        this.downloadBtn.addEventListener('click', () => this.downloadContent());
        this.exportBtn.addEventListener('click', () => this.exportContent());
        
        // Chat events
        this.chatForm.addEventListener('submit', (e) => this.sendChatMessage(e));
        
        // Auto-save form data
        [this.eventTypeSelect, this.eventDateInput, this.eventTimeInput, this.guestCountInput, 
         this.budgetRangeSelect, this.venueTypeSelect, this.planningTimeSelect, this.locationInput,
         this.prioritiesInput, this.specialRequestsInput].forEach(input => {
            const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
            input.addEventListener(eventType, () => this.saveFormData());
        });
    }

    loadStoredData() {
        const stored = localStorage.getItem('event_planner_form');
        if (stored) {
            const data = JSON.parse(stored);
            this.eventTypeSelect.value = data.eventType || '';
            this.eventDateInput.value = data.eventDate || '';
            this.eventTimeInput.value = data.eventTime || '';
            this.guestCountInput.value = data.guestCount || '';
            this.budgetRangeSelect.value = data.budgetRange || '';
            this.venueTypeSelect.value = data.venueType || '';
            this.planningTimeSelect.value = data.planningTime || '';
            this.locationInput.value = data.location || '';
            this.prioritiesInput.value = data.priorities || '';
            this.specialRequestsInput.value = data.specialRequests || '';
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
            eventDate: this.eventDateInput.value,
            eventTime: this.eventTimeInput.value,
            guestCount: this.guestCountInput.value,
            budgetRange: this.budgetRangeSelect.value,
            venueType: this.venueTypeSelect.value,
            planningTime: this.planningTimeSelect.value,
            location: this.locationInput.value,
            priorities: this.prioritiesInput.value,
            specialRequests: this.specialRequestsInput.value
        };
        localStorage.setItem('event_planner_form', JSON.stringify(formData));
    }

    saveChatHistory() {
        sessionStorage.setItem('studio_tool_chat', JSON.stringify(this.chatHistory));
    }

    async generatePlan() {
        // Validate required fields
        if (!this.eventTypeSelect.value.trim()) {
            this.showToast('Please select an event type', 'error');
            this.eventTypeSelect.focus();
            return;
        }

        if (!this.eventDateInput.value.trim()) {
            this.showToast('Please select an event date', 'error');
            this.eventDateInput.focus();
            return;
        }

        if (!this.guestCountInput.value.trim()) {
            this.showToast('Please enter the number of guests', 'error');
            this.guestCountInput.focus();
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
        const eventDate = this.eventDateInput.value;
        const eventTime = this.eventTimeInput.value;
        const guestCount = this.guestCountInput.value;
        const budgetRange = this.budgetRangeSelect.value;
        const venueType = this.venueTypeSelect.value;
        const planningTime = this.planningTimeSelect.value;
        const location = this.locationInput.value.trim();
        const priorities = this.prioritiesInput.value.trim();
        const specialRequests = this.specialRequestsInput.value.trim();

        let prompt = `Create a comprehensive event planning timeline for a ${eventType} with ${guestCount} guests on ${eventDate}`;
        
        if (eventTime) {
            prompt += ` at ${eventTime}`;
        }
        
        if (location) {
            prompt += ` in ${location}`;
        }
        
        prompt += '.';
        
        if (budgetRange) {
            const budgetText = budgetRange.replace('-', ' to ').replace('k', ',000').replace('m', ',00,000');
            prompt += ` Budget range: ${budgetText}.`;
        }
        
        if (venueType) {
            prompt += ` Preferred venue type: ${venueType}.`;
        }
        
        if (planningTime) {
            prompt += ` Planning timeline: ${planningTime}.`;
        }
        
        if (priorities) {
            prompt += `\n\nKey requirements and priorities: ${priorities}`;
        }
        
        if (specialRequests) {
            prompt += `\n\nSpecial requests: ${specialRequests}`;
        }
        
        prompt += `\n\nPlease provide:
1. A detailed week-by-week planning timeline with specific tasks and deadlines
2. Vendor coordination schedule (when to book each type of vendor)
3. Budget breakdown suggestions for different categories
4. Critical milestones and checkpoints
5. Day-of-event timeline and coordination tips
6. Contingency planning suggestions

Make it practical and actionable for event planning in Bangladesh, considering local vendors and customs.`;
        
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
                    <span>Creating your timeline</span>
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
        this.generateBtn.textContent = isGenerating ? '🔄 Creating Timeline...' : '🤖 Generate Planning Timeline';
        
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
        
        this.chatInput.placeholder = 'Ask me to modify the timeline or add more details...';
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
                        <p>👋 Welcome! Fill out the event details above and click "Generate Planning Timeline" to create your comprehensive event plan. Then you can chat with me to refine it!</p>
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
        this.chatInput.placeholder = 'Generate a timeline first...';
        
        // Clear session storage
        sessionStorage.removeItem('studio_tool_chat');
    }

    clearForm() {
        // Clear form inputs
        this.eventTypeSelect.value = '';
        this.eventDateInput.value = '';
        this.eventTimeInput.value = '';
        this.guestCountInput.value = '';
        this.budgetRangeSelect.value = '';
        this.venueTypeSelect.value = '';
        this.planningTimeSelect.value = '';
        this.locationInput.value = '';
        this.prioritiesInput.value = '';
        this.specialRequestsInput.value = '';
        
        // Clear chat
        this.clearChat();
        
        // Clear stored form data
        localStorage.removeItem('event_planner_form');
        
        this.showToast('Form cleared!', 'success');
    }

    copyContent() {
        if (!this.generatedContent) return;
        
        navigator.clipboard.writeText(this.generatedContent).then(() => {
            this.showToast('Timeline copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy content', 'error');
        });
    }

    downloadContent() {
        if (!this.generatedContent) return;
        
        const eventName = this.eventTypeSelect.value || 'event';
        const blob = new Blob([this.generatedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${eventName}_planning_timeline.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Timeline downloaded!', 'success');
    }

    exportContent() {
        if (!this.generatedContent) return;
        
        // Create a more formatted version
        const eventType = this.eventTypeSelect.value;
        const eventDate = this.eventDateInput.value;
        const guestCount = this.guestCountInput.value;
        
        const formattedContent = `
EVENT PLANNING TIMELINE
Generated by PlannrAI Sync Studio
${new Date().toLocaleString()}

Event: ${eventType}
Date: ${eventDate}
Guests: ${guestCount}
Budget: ${this.budgetRangeSelect.value}
Venue Type: ${this.venueTypeSelect.value}
Location: ${this.locationInput.value}

${this.generatedContent}

---
Form Details:
Event Type: ${eventType}
Date: ${eventDate}
Time: ${this.eventTimeInput.value}
Guests: ${guestCount}
Budget Range: ${this.budgetRangeSelect.value}
Venue Type: ${this.venueTypeSelect.value}
Planning Time: ${this.planningTimeSelect.value}
Location: ${this.locationInput.value}
Priorities: ${this.prioritiesInput.value}
Special Requests: ${this.specialRequestsInput.value}
        `.trim();
        
        const blob = new Blob([formattedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${eventType}_detailed_plan.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Detailed plan exported!', 'success');
    }

    saveToActivity() {
        // Save to recent activity for the main studio dashboard
        const eventType = this.eventTypeSelect.value;
        const eventDate = this.eventDateInput.value;
        
        const activity = {
            id: Date.now().toString(),
            toolName: 'event-planner',
            title: `${eventType} Planning Timeline`,
            content: this.generatedContent,
            icon: '📅',
            timeAgo: 'Just now',
            timestamp: new Date().toISOString(),
            details: `${eventDate} • ${this.guestCountInput.value} guests`
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
    window.eventPlannerTool = new EventPlannerTool();
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
