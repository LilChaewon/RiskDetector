package com.riskdetector.riskdetector.controller;

import com.riskdetector.riskdetector.dto.chatbot.ChatbotRetrieveRequest;
import com.riskdetector.riskdetector.dto.chatbot.ChatbotRetrieveResponse;
import com.riskdetector.riskdetector.service.ChatbotRetrievalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotRetrievalService chatbotRetrievalService;

    @PostMapping("/retrieve")
    public ResponseEntity<ChatbotRetrieveResponse> retrieve(@RequestBody ChatbotRetrieveRequest request) {
        return ResponseEntity.ok(chatbotRetrievalService.retrieve(request));
    }
}
