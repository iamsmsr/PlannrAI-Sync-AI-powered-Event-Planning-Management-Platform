package com.event.event_management.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    // @Autowired
    // private WebSocketAuthInterceptor webSocketAuthInterceptor; // Temporarily disabled
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register WebSocket endpoint that the client will use to connect
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow all origins for development
                .withSockJS(); // Enable SockJS fallback options
        
        System.out.println("✅ WebSocket endpoint /ws registered with SockJS support");
    }
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple broker to broadcast messages to subscribed clients
        registry.enableSimpleBroker("/topic", "/queue");
        
        // Set application destination prefix for messages from client
        registry.setApplicationDestinationPrefixes("/app");
        
        // Set user destination prefix for private messages
        registry.setUserDestinationPrefix("/user");
        
        System.out.println("✅ Message broker configured: /topic, /queue, /app, /user");
    }
    
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Temporarily disabled for troubleshooting
        // registration.interceptors(webSocketAuthInterceptor);
        System.out.println("✅ WebSocket authentication interceptor temporarily disabled");
    }
}
