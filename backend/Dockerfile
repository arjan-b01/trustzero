# Stage 1: Build the application using Maven
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create uploads directory with correct permissions
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# Environment defaults — secrets must be provided at runtime
ENV SPRING_PROFILES_ACTIVE=default
ENV EVIDENCE_UPLOAD_DIR=/app/uploads

ENTRYPOINT ["java", "-jar", "app.jar"]