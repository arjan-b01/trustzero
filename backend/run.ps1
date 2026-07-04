# Set Java Home to JDK 17
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"

# Set Database Credentials
$env:DB_URL = "jdbc:postgresql://localhost:5432/escrow_db"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "12345678"

# Set JWT Secret (base64 encoded 256-bit key)
$env:JWT_SECRET = "dGhpcy1pcy1hLXNlY3VyZS1iYXNlNjQtZW5jb2RlZC1qd3Qtc2VjcmV0LWZvci10cnVzdHplcm8tZXNjcm93LWVuZ2luZQ=="

Write-Host "Starting TrustZero Escrow Engine..." -ForegroundColor Green
.\mvnw.cmd spring-boot:run
