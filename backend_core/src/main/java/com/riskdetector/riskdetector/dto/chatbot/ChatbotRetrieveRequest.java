package com.riskdetector.riskdetector.dto.chatbot;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatbotRetrieveRequest {
    private String query;
    private String contractType;
    private Integer topK;
}
