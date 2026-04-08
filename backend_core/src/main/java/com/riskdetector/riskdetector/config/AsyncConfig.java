package com.riskdetector.riskdetector.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "ocrExecutor")
    public Executor ocrExecutor() {
        return Executors.newFixedThreadPool(5);
    }

    @Bean(name = "analysisExecutor")
    public Executor analysisExecutor() {
        return Executors.newFixedThreadPool(5);
    }
}
