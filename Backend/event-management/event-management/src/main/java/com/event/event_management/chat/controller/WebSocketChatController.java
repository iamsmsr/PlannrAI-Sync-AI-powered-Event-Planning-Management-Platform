package com.event.event_management.chat.controller;

import com.event.event_management.chat.model.Message;
import com.event.event_management.chat.service.ChatService;
import com.event.event_management.chat.service.GroupChatService;
import com.event.event_management.user.model.User;
import com.event.event_management.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class WebSocketChatController {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private GroupChatService groupChatService;
    
    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload Map<String, Object> messageData) {
        try {
            System.out.println("📨 WebSocket message received: " + messageData);
            
            String chatId = (String) messageData.get("chatId");
            String senderId = (String) messageData.get("senderId");
            String content = (String) messageData.get("content");
            String messageType = (String) messageData.get("messageType"); // "INDIVIDUAL" or "GROUP"
            
            if (chatId == null || senderId == null || content == null) {
                System.err.println("❌ Missing required fields in message");
                return;
            }
            
            // Default to individual chat if messageType not specified
            if (messageType == null) {
                messageType = "INDIVIDUAL";
            }
            
            // Get sender info - use fallback if user not found
            User sender = userService.findById(senderId);
            String senderName = "Unknown User";
            if (sender != null) {
                senderName = sender.getName();
                System.out.println("✅ Sender found: " + senderName);
            } else {
                System.err.println("⚠️ Sender not found, using fallback: " + senderId);
                senderName = "User-" + senderId.substring(senderId.length() - 4);
            }
            
            Message savedMessage;
            
            // Handle different message types
            if ("GROUP".equals(messageType)) {
                // Verify user is member of group chat
                if (!groupChatService.isUserMemberOfGroupChat(chatId, senderId)) {
                    System.err.println("❌ User not authorized to send to group chat: " + chatId);
                    return;
                }
                
                // Save group message
                savedMessage = Message.createGroupMessage(chatId, senderId, content);
                savedMessage = chatService.saveMessage(savedMessage);
                System.out.println("✅ Group message saved: " + savedMessage.getId());
            } else {
                // Save individual message
                savedMessage = chatService.sendMessage(chatId, senderId, content);
                System.out.println("✅ Individual message saved: " + savedMessage.getId());
            }
            
            // Create response with all needed data
            Map<String, Object> response = Map.of(
                "id", savedMessage.getId(),
                "chatId", chatId,
                "senderId", senderId,
                "senderName", senderName,
                "content", content,
                "messageType", messageType,
                "timestamp", savedMessage.getTimestamp().toString()
            );
            
            // Broadcast to all users in the chat
            messagingTemplate.convertAndSend("/topic/chat/" + chatId, response);
            System.out.println("✅ Message broadcasted to chat: " + chatId + " (Type: " + messageType + ")");
            
        } catch (Exception e) {
            System.err.println("❌ Error handling message: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @MessageMapping("/joinChat")
    public void joinChat(@Payload Map<String, Object> joinData) {
        try {
            String chatId = (String) joinData.get("chatId");
            String userId = (String) joinData.get("userId");
            String chatType = (String) joinData.get("chatType"); // "INDIVIDUAL" or "GROUP"
            
            if (chatId == null || userId == null) {
                System.err.println("❌ Missing chatId or userId in join request");
                return;
            }
            
            // Default to individual chat if chatType not specified
            if (chatType == null) {
                chatType = "INDIVIDUAL";
            }
            
            User user = userService.findById(userId);
            if (user == null) {
                System.err.println("❌ User not found: " + userId);
                return;
            }
            
            // Verify authorization for group chats
            if ("GROUP".equals(chatType)) {
                if (!groupChatService.isUserMemberOfGroupChat(chatId, userId)) {
                    System.err.println("❌ User not authorized to join group chat: " + chatId);
                    return;
                }
            }
            
            // Send join notification
            Map<String, Object> joinNotification = Map.of(
                "type", "JOIN",
                "chatId", chatId,
                "userId", userId,
                "userName", user.getName(),
                "chatType", chatType,
                "message", user.getName() + " joined the chat"
            );
            
            messagingTemplate.convertAndSend("/topic/chat/" + chatId, joinNotification);
            System.out.println("✅ User joined: " + user.getName() + " -> " + chatId + " (Type: " + chatType + ")");
            
        } catch (Exception e) {
            System.err.println("❌ Error handling join: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
