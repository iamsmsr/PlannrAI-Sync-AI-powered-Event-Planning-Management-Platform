package com.event.event_management.chat.controller;

import com.event.event_management.chat.model.Chat;
import com.event.event_management.chat.model.Message;
import com.event.event_management.chat.service.ChatService;
import com.event.event_management.user.model.User;
import com.event.event_management.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ChatService chatService;
    @Autowired
    private UserService userService;

    // Get all chats for the authenticated user
    @GetMapping("/my")
    public List<Chat> getMyChats(Authentication authentication) {
        String userId = null;
        String email = null;
        if (authentication != null) {
            email = authentication.getName();
            User user = userService.findByEmail(email);
            userId = user.getId();
            System.out.println("🎯 Getting chats for user: " + userId + " (" + email + ")");
        } else {
            // Business user: get info from headers
            // (Assume frontend sends X-Business-Id and X-Business-Email)
            // You may need to adjust this for your actual business user model
            email = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes())
                .getRequest().getHeader("X-Business-Email");
            userId = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes())
                .getRequest().getHeader("X-Business-Id");
            System.out.println("🎯 Getting chats for business user: " + userId + " (" + email + ")");
        }
        List<Chat> chats = chatService.getUserChats(userId);
        System.out.println("🎯 Returning " + chats.size() + " chats to frontend");
        return chats;
    }

    // Get all messages for a chat
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<?> getChatMessages(@PathVariable String chatId, Authentication authentication) {
        try {
            String userId = null;
            if (authentication != null) {
                String email = authentication.getName();
                User user = userService.findByEmail(email);
                userId = user.getId();
            } else {
                userId = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes())
                    .getRequest().getHeader("X-Business-Id");
            }
            List<Message> messages = chatService.getChatMessages(chatId, userId);
            return ResponseEntity.ok(messages);
        } catch (SecurityException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(403).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching messages");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // Create a new chat between two users
    // Replace your existing createChat method with this improved version
    @PostMapping("/create")
    public ResponseEntity<?> createChat(@RequestBody CreateChatRequest request, Authentication authentication) {
        try {
            String currentUserId = null;
            String currentUserEmail = null;
            String businessId = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes())
                .getRequest().getHeader("X-Business-Id");
            String businessEmail = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes())
                .getRequest().getHeader("X-Business-Email");
                
            if (authentication != null) {
                // Regular user creating chat with business
                currentUserEmail = authentication.getName();
                User currentUser = userService.findByEmail(currentUserEmail);
                currentUserId = currentUser.getId();
                
                if (businessId != null && businessEmail != null) {
                    // Override otherUserEmail if business headers are present
                    currentUserId = businessId;
                    currentUserEmail = businessEmail;
                }
            } else if (businessId != null && businessEmail != null) {
                // Business user creating chat
                currentUserId = businessId;
                currentUserEmail = businessEmail;
            } else {
                return ResponseEntity.badRequest().body(Map.of("message", "No valid authentication found"));
            }
            User otherUser = userService.findByEmail(request.getOtherUserEmail());
            System.out.println("💬 Creating chat between " + currentUserEmail + " and " + request.getOtherUserEmail());
            System.out.println("💬 Current user ID: " + currentUserId);
            if (otherUser == null) {
                System.out.println("❌ Other user not found: " + request.getOtherUserEmail());
                Map<String, String> error = new HashMap<>();
                error.put("message", "User not found: " + request.getOtherUserEmail());
                return ResponseEntity.badRequest().body(error);
            }
            System.out.println("💬 Other user ID: " + otherUser.getId());
            if (currentUserId.equals(otherUser.getId())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Cannot create chat with yourself");
                return ResponseEntity.badRequest().body(error);
            }
            Chat chat = chatService.createOrGetChat(currentUserId, otherUser.getId());
            System.out.println("💬 Final chat ID: " + chat.getId());
            System.out.println("💬 Chat participants: " + chat.getUserIds());
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Chat created successfully");
            response.put("chat", chat);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ Error creating chat: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error creating chat: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // Send a message in a chat
    @PostMapping("/{chatId}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable String chatId, @RequestBody SendMessageRequest request, Authentication authentication) {
        try {
            String senderId = null;
            if (authentication != null) {
                String email = authentication.getName();
                User user = userService.findByEmail(email);
                senderId = user.getId();
            } else {
                senderId = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes())
                    .getRequest().getHeader("X-Business-Id");
            }
            Message message = chatService.sendMessage(chatId, senderId, request.getContent(), senderId);
            return ResponseEntity.ok(message);
        } catch (SecurityException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(403).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error sending message");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // Request classes
    public static class CreateChatRequest {
        private String otherUserEmail;
        
        public String getOtherUserEmail() { return otherUserEmail; }
        public void setOtherUserEmail(String otherUserEmail) { this.otherUserEmail = otherUserEmail; }
    }

    public static class SendMessageRequest {
        private String content;
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }

    public static class CreateOrGetChatRequest {
        private String participantId;
        
        public String getParticipantId() { return participantId; }
        public void setParticipantId(String participantId) { this.participantId = participantId; }
    }

    // Create or get existing chat with a specific user
    @PostMapping("/createOrGet")
    public ResponseEntity<?> createOrGetChat(@RequestBody CreateOrGetChatRequest request, Authentication authentication) {
        try {
            String email = authentication.getName();
            User currentUser = userService.findByEmail(email);
            User otherUser = userService.findById(request.getParticipantId());
            
            if (otherUser == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "User not found");
                return ResponseEntity.badRequest().body(error);
            }
            
            if (currentUser.getId().equals(otherUser.getId())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Cannot create chat with yourself");
                return ResponseEntity.badRequest().body(error);
            }
            
            Chat chat = chatService.createOrGetChat(currentUser.getId(), otherUser.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Chat created/found successfully");
            response.put("chat", chat);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error creating chat: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}