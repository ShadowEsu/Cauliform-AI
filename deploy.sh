#!/bin/bash

# Cauliform - Google Cloud Run Deployment Script
# Usage: ./deploy.sh [project-id] [region]

set -e

PROJECT_ID=${1:-$(gcloud config get-value project)}
REGION=${2:-"us-central1"}
SERVICE_NAME="cauliform"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying Cauliform to Google Cloud Run"
echo "   Project: ${PROJECT_ID}"
echo "   Region: ${REGION}"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth print-identity-token &> /dev/null; then
    echo "❌ Not authenticated. Run: gcloud auth login"
    exit 1
fi

# Enable required APIs
echo "📦 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com --project=${PROJECT_ID}
gcloud services enable run.googleapis.com --project=${PROJECT_ID}
gcloud services enable artifactregistry.googleapis.com --project=${PROJECT_ID}

# Build and push the container image
echo "🔨 Building container image..."
gcloud builds submit --tag ${IMAGE_NAME} --project=${PROJECT_ID}

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=production" \
    --project=${PROJECT_ID}

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --project=${PROJECT_ID} \
    --format='value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "🌐 Service URL: ${SERVICE_URL}"
echo ""
echo "📝 Next steps:"
echo "   1. Set environment variables in Cloud Run console"
echo "   2. Update NEXT_PUBLIC_APP_URL to: ${SERVICE_URL}"
echo "   3. Configure Twilio webhook URL to: ${SERVICE_URL}/api/webhook"
