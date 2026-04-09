FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY . .
RUN chmod +x gradlew
EXPOSE 8080
# Default command (can be overridden by docker-compose)
CMD ["./gradlew", "bootRun"]
