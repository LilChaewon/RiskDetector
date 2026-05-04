package com.riskdetector.riskdetector.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.s3.S3Client;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "aws")
@Getter
@Setter
public class AwsConfig {

    private String region;
    private CredentialsProperties credentials = new CredentialsProperties();
    private S3Properties s3 = new S3Properties();
    private LambdaProperties lambda = new LambdaProperties();

    private software.amazon.awssdk.auth.credentials.AwsCredentialsProvider buildCredentialsProvider() {
        String accessKey = credentials.getAccessKey();
        String secretKey = credentials.getSecretKey();
        if (accessKey != null && !accessKey.isBlank() && secretKey != null && !secretKey.isBlank()) {
            return StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey, secretKey));
        }
        // 키 없으면 환경 기본 체인(IAM Role, EC2 메타데이터 등) 사용
        return software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider.create();
    }

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(buildCredentialsProvider())
                .build();
    }

    @Bean
    public LambdaClient lambdaClient() {
        // Bedrock 호출이 30초를 넘길 수 있으므로 SDK 기본 타임아웃을 그대로 두면
        // 백엔드가 ApiCallTimeoutException으로 실패해 버린다. 5분으로 확장.
        Duration callTimeout = Duration.ofMinutes(5);
        return LambdaClient.builder()
                .region(Region.of(region))
                .credentialsProvider(buildCredentialsProvider())
                .overrideConfiguration(ClientOverrideConfiguration.builder()
                        .apiCallTimeout(callTimeout)
                        .apiCallAttemptTimeout(callTimeout)
                        .build())
                .build();
    }

    @Getter
    @Setter
    public static class CredentialsProperties {
        private String accessKey;
        private String secretKey;
    }

    @Getter
    @Setter
    public static class S3Properties {
        private String serviceBucket;
    }

    @Getter
    @Setter
    public static class LambdaProperties {
        private String ocrFunctionName;
        private String analysisFunctionName;
    }
}
