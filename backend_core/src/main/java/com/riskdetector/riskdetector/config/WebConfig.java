package com.riskdetector.riskdetector.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// CORS는 SecurityConfig#corsConfigurationSource()에서 일괄 처리한다.
// 여기서 별도로 addCorsMappings()를 등록하면 배포 환경에서 origin이 localhost로 제한되어
// Authorization 헤더가 프리플라이트에서 차단되는 문제가 발생한다.
@Configuration
public class WebConfig implements WebMvcConfigurer {
}
