package com.riskdetector.riskdetector.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class LambdaUtil {

    // Lambda 동기(RequestResponse) payload 한도는 6MB. 안전하게 5.5MB에서 컷.
    private static final int SYNC_PAYLOAD_LIMIT_BYTES = 5_500_000;

    private final LambdaClient lambdaClient;
    private final ObjectMapper objectMapper;

    public InvokeResponse invokeAndWait(String functionName, Object payload) throws Exception {
        String payloadJson = objectMapper.writeValueAsString(payload);
        int sizeBytes = payloadJson.getBytes(StandardCharsets.UTF_8).length;
        log.info("Lambda invoke: function={}, payloadBytes={}", functionName, sizeBytes);
        if (sizeBytes > SYNC_PAYLOAD_LIMIT_BYTES) {
            throw new IllegalStateException(
                    "Lambda payload too large: " + sizeBytes + " bytes (limit " + SYNC_PAYLOAD_LIMIT_BYTES + ")");
        }
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
