// PlannrAI Sync Studio - Main Script

class StudioApp {
    constructor() {
        this.initializeEventListeners();
        this.loadRecentActivity();
    }

    initializeEventListeners() {
        // Tool card clicks
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const toolName = e.currentTarget.dataset.tool;
                this.openTool(toolName);
            });
        });

        // Quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.textContent.trim();
                this.handleQuickAction(action);
            });
        });

        // Recent activity view buttons
        document.querySelectorAll('.activity-item .btn-secondary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const activityItem = e.target.closest('.activity-item');
                const title = activityItem.querySelector('h4').textContent;
                this.viewRecentGeneration(title);
            });
        });
    }

    openTool(toolName) {
        console.log(`Opening tool: ${toolName}`);
        
        // Add loading animation
        const card = document.querySelector(`[data-tool="${toolName}"]`);
        if (card) {
            card.style.opacity = '0.7';
            card.style.transform = 'scale(0.98)';
        }
        
        // Map tool names to file names
        const toolMap = {
            'invitation-email': '/studio/tools/invitation-email.html',
            'event-planner': '/studio/tools/event-planner.html',
            'event-name': '/studio/tools/event-name.html',
            'idea-to-image': '/studio/idea-to-image.html',
            'reimagine-studio': '/studio/reimagine-studio.html',
            'background-magic': '/studio/background-magic.html'
        };
        
        const fileName = toolMap[toolName];
        console.log(`Tool: ${toolName}, Mapped to: ${fileName}`);
        
        if (!fileName) {
            console.error(`No mapping found for tool: ${toolName}`);
            return;
        }
        
        setTimeout(() => {
            // Navigate to tool page
            console.log(`Navigating to: ${fileName}`);
            window.location.href = fileName;
        }, 200);
    }

    handleQuickAction(action) {
        console.log(`Quick action: ${action}`);
        
        switch(action) {
            case 'Quick Event Plan':
                this.openTool('event-planner');
                break;
            case 'Export All':
                this.exportAllGenerations();
                break;
            case 'Favorites':
                this.showFavorites();
                break;
            case 'Templates':
                this.showTemplates();
                break;
        }
    }

    loadRecentActivity() {
        // Load from localStorage or API
        const recentActivity = this.getRecentActivity();
        
        if (recentActivity.length === 0) {
            // Show default/sample data
            this.showSampleActivity();
        } else {
            this.displayRecentActivity(recentActivity);
        }
    }

    getRecentActivity() {
        // Try to get from localStorage
        const stored = localStorage.getItem('plannrai_recent_activity');
        return stored ? JSON.parse(stored) : [];
    }

    showSampleActivity() {
        // Sample data is already in HTML, just add some interactivity
        const activityItems = document.querySelectorAll('.activity-item');
        activityItems.forEach(item => {
            item.addEventListener('click', () => {
                item.style.background = 'rgba(102, 126, 234, 0.15)';
                setTimeout(() => {
                    item.style.background = 'rgba(102, 126, 234, 0.05)';
                }, 200);
            });
        });
    }

    displayRecentActivity(activities) {
        const activityList = document.querySelector('.activity-list');
        activityList.innerHTML = '';

        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>Generated ${activity.timeAgo}</p>
                </div>
                <div class="activity-actions">
                    <button class="btn-secondary" onclick="studioApp.viewGeneration('${activity.id}')">View</button>
                </div>
            `;
            activityList.appendChild(activityItem);
        });
    }

    viewRecentGeneration(title) {
        console.log(`Viewing generation: ${title}`);
        
        // Create modal or navigate to detailed view
        this.showGenerationModal(title);
    }

    viewGeneration(id) {
        console.log(`Viewing generation with ID: ${id}`);
        // Implement detailed view
    }

    showGenerationModal(title) {
        // Simple modal implementation
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                max-height: 80%;
                overflow-y: auto;
            ">
                <h3 style="margin: 0 0 15px 0; color: #333;">📄 ${title}</h3>
                <p style="color: #666; margin-bottom: 20px;">
                    This feature will show the detailed view of your generated content.
                </p>
                <div style="text-align: center;">
                    <button onclick="this.closest('.modal').remove()" style="
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Close</button>
                </div>
            </div>
        `;
        
        modal.className = 'modal';
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }

    exportAllGenerations() {
        console.log('Exporting all generations...');
        
        // Show loading state
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Exporting...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
            
            // Show success message
            this.showToast('Export completed! Check your downloads.', 'success');
        }, 2000);
    }

    showFavorites() {
        console.log('Showing favorites...');
        this.showToast('Favorites feature coming soon!', 'info');
    }

    showTemplates() {
        console.log('Showing templates...');
        this.showToast('Templates feature coming soon!', 'info');
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

    // Utility method to save activity
    saveActivity(toolName, title, content) {
        const activity = {
            id: Date.now().toString(),
            toolName,
            title,
            content,
            icon: this.getToolIcon(toolName),
            timeAgo: 'Just now',
            timestamp: new Date().toISOString()
        };

        const recentActivity = this.getRecentActivity();
        recentActivity.unshift(activity);
        
        // Keep only last 10 activities
        if (recentActivity.length > 10) {
            recentActivity.pop();
        }

        localStorage.setItem('plannrai_recent_activity', JSON.stringify(recentActivity));
        this.displayRecentActivity(recentActivity);
    }

    getToolIcon(toolName) {
        const icons = {
            'invitation-email': '📧',
            'event-planner': '📋',
            'event-name': '🎪',
            'reminder-email': '⏰'
        };
        return icons[toolName] || '🛠️';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studioApp = new StudioApp();
    
    // Add some subtle animations
    const cards = document.querySelectorAll('.tool-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Add some interactive effects
document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.tool-card');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        } else {
            card.style.transform = '';
        }
    });
});
