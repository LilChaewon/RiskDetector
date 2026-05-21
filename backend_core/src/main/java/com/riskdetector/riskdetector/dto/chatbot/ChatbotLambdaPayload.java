package com.riskdetector.riskdetector.dto.chatbot;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatbotLambdaPayload {
    private final String mode;
    private final String retrievalQuery;
    private final String contractType;
    private final Integer topK;
}
