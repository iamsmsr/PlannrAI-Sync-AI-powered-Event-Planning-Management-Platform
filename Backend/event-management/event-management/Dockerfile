# Multi-stage Dockerfile
# Stage 1: build the jar using Maven (uses the project's mvnw)
# Stage 2: copy resulting jar into a slim JRE image and run

# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /build

# Copy maven wrapper and pom and source
COPY . /build

# Ensure the maven wrapper is executable then build (skip tests to speed up)
RUN chmod +x mvnw && ./mvnw -B -DskipTests package

# Runtime stage
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy the jar from the build stage (assumes a single executable jar in target/)
COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
