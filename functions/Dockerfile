# Use the official Python image as a base
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*


# Copy requirements.txt and install dependencies
COPY requirements.txt ./
RUN pip install --upgrade pip \
    && pip install -r requirements.txt --no-cache-dir

# Copy the rest of the code
COPY . .

# Expose port (Cloud Run uses $PORT env var)
EXPOSE 8080

# Set the entrypoint for Cloud Run
CMD exec uvicorn main:app --host 0.0.0.0 --port 8080
