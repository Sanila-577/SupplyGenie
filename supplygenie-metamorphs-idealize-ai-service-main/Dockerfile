# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (simple single line)
RUN apt-get update && apt-get install -y gcc

# Copy requirements first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Expose port (Cloud Run expects 8080)
EXPOSE 8080

# Start the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
