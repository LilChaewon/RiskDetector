# ── 1단계: 빌드 ──────────────────────────────────────────
FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /app

COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle settings.gradle ./

# 의존성 캐시 레이어 (소스 변경 시 재다운로드 방지)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon -q 2>/dev/null || true

# 소스 복사 후 JAR 빌드 (테스트 제외)
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon -x test

# ── 2단계: 실행 (JRE만 사용 → 이미지 경량화) ─────────────
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Dserver.port=${PORT:-8080} -jar app.jar"]
