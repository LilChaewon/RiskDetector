package com.riskdetector.riskdetector.service;

import com.riskdetector.riskdetector.config.AwsConfig;
import com.riskdetector.riskdetector.dto.chatbot.ChatbotLambdaPayload;
import com.riskdetector.riskdetector.dto.chatbot.ChatbotRetrieveRequest;
import com.riskdetector.riskdetector.dto.chatbot.ChatbotRetrieveResponse;
import com.riskdetector.riskdetector.util.LambdaUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotRetrievalService {

    private final LambdaUtil lambdaUtil;
    private final AwsConfig awsConfig;

    public ChatbotRetrieveResponse retrieve(ChatbotRetrieveRequest request) {
        ChatbotRetrieveResponse failureResponse = new ChatbotRetrieveResponse();
        failureResponse.setResults(Collections.emptyList());

        if (request == null || request.getQuery() == null || request.getQuery().isBlank()) {
            failureResponse.setSuccess(false);
            failureResponse.setError("Missing query.");
            return failureResponse;
        }

        ChatbotLambdaPayload payload = ChatbotLambdaPayload.builder()
                .mode("retrieve")
                .retrievalQuery(request.getQuery().trim())
                .contractType(normalizeContractType(request.getContractType()))
                .topK(clampTopK(request.getTopK()))
                .build();

        try {
            InvokeResponse response = lambdaUtil.invokeAndWait(
                    awsConfig.getLambda().getAnalysisFunctionName(), payload);
            if (lambdaUtil.hasError(response)) {
                log.warn("Chatbot retrieve lambda returned functionError: {}", response.functionError());
                failureResponse.setSuccess(false);
                failureResponse.setError("Lambda function error: " + response.functionError());
                return failureResponse;
            }
            ChatbotRetrieveResponse parsed = lambdaUtil.parseResponse(response, ChatbotRetrieveResponse.class);
            if (parsed.getResults() == null) {
                parsed.setResults(Collections.emptyList());
            }
            return parsed;
        } catch (Exception e) {
            log.error("Chatbot retrieve lambda invocation failed", e);
            failureResponse.setSuccess(false);
            failureResponse.setError(e.getMessage());
            return failureResponse;
        }
    }

    private String normalizeContractType(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim().toLowerCase();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Integer clampTopK(Integer raw) {
        if (raw == null) return null;
        if (raw < 1) return 1;
        if (raw > 10) return 10;
        return raw;
    }
}
