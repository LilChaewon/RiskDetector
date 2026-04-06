package com.riskdetector.riskdetector.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

@Component
@RequiredArgsConstructor
public class LambdaUtil {

    private final LambdaClient lambdaClient;
    private final ObjectMapper objectMapper;

    public InvokeResponse invokeAndWait(String functionName, Object payload) throws Exception {
        String payloadJson = objectMapper.writeValueAsString(payload);
        return lambdaClient.invoke(InvokeRequest.builder()
                .functionName(functionName)
                .payload(SdkBytes.fromUtf8String(payloadJson))
                .build());
    }

    public boolean hasError(InvokeResponse response) {
        return response.functionError() != null;
    }

    public <T> T parseResponse(InvokeResponse response, Class<T> clazz) throws Exception {
        return objectMapper.readValue(response.payload().asUtf8String(), clazz);
    }
}
