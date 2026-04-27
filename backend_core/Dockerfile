FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle settings.gradle ./

# Gradle Wrapper 및 의존성만 먼저 다운로드 (캐시 레이어)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon -q 2>/dev/null || true

# 소스 코드 복사
COPY . .
RUN chmod +x gradlew

EXPOSE 8080
CMD ["./gradlew", "bootRun", "--no-daemon"]
