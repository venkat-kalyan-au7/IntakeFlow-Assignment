FROM node:24.19.0-alpine AS frontend-build
WORKDIR /workspace/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:25-jdk AS backend-build
WORKDIR /workspace/backend
COPY backend/.mvn/ .mvn/
COPY backend/mvnw backend/mvnw.cmd backend/pom.xml ./
RUN chmod +x mvnw && ./mvnw -DskipTests dependency:go-offline
COPY backend/src/ src/
COPY --from=frontend-build /workspace/frontend/dist/frontend/browser/ src/main/resources/static/
RUN ./mvnw -DskipTests package

FROM eclipse-temurin:25-jre
WORKDIR /app
RUN addgroup --system intakeflow && adduser --system --ingroup intakeflow intakeflow
COPY --from=backend-build /workspace/backend/target/intakeflow-api-1.0.0.jar app.jar
USER intakeflow
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
