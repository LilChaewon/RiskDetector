package com.riskdetector.riskdetector.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@ConfigurationProperties(prefix = "aws")
@Getter
@Setter
public class AwsConfig {

    private String region;
    private S3Properties s3 = new S3Properties();
    private LambdaProperties lambda = new LambdaProperties();

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .build();
    }

    @Bean
    public LambdaClient lambdaClient() {
        return LambdaClient.builder()
                .region(Region.of(region))
                .build();
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
