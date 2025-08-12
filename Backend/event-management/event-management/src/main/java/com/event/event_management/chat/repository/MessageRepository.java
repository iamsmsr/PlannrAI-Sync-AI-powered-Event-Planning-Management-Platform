package com.event.event_management.chat.repository;

import com.event.event_management.chat.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByChatIdOrderByTimestampAsc(String chatId);
    List<Message> findByGroupChatIdOrderByTimestampAsc(String groupChatId);
}