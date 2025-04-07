#!/bin/bash

# Deployment script for Handy App
# This script will build the frontend and deploy all Firebase resources

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Step 1: Install dependencies if needed
echo "📦 Checking dependencies..."

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "⚠️ Firebase CLI not found, installing..."
    npm install -g firebase-tools
fi

# Step 2: Build frontend
echo "🏗️ Building frontend application..."
cd frontend/my-app
npm install
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
echo "✅ Frontend built successfully!"
cd ../..

# Step 3: Ensure backend dependencies are installed
echo "🐍 Setting up backend dependencies..."
cd backend

# Create Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt

# Check if .env file exists for Twilio credentials
if [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env file not found in backend directory."
    echo "    Make sure you have properly configured your Twilio credentials."
    echo "    Copying .env.template to .env for reference..."
    cp .env.template .env
    echo "    Please update .env with your Twilio credentials before testing!"
fi

# Deactivate virtual environment
deactivate
cd ..

# Step 4: Deploy to Firebase
echo "🔥 Deploying to Firebase..."

# Login to Firebase if not already logged in
firebase login --no-localhost

# Deploy functions first to ensure they're available
echo "🔄 Deploying Firebase Functions..."
firebase deploy --only functions

# Deploy hosting to serve the frontend
echo "🌐 Deploying frontend hosting..."
firebase deploy --only hosting

# Deploy other Firebase resources
echo "🔄 Deploying other Firebase resources..."
firebase deploy --only firestore,storage,database

echo "🎉 Deployment complete!"
echo ""
echo "Your application should now be available at the Firebase hosting URL."
echo "Check the Firebase console for more details and logs."
echo ""
echo "If you need to test the Twilio integration, use one of these methods:"
echo "1. Visit your web app and use the 'Send Text' button on a contractor detail page"
echo "2. Use curl to test the function directly:"
echo "   curl -X POST -H 'Content-Type: application/json' -d '{\"phoneNumber\": \"+1XXXXXXXXXX\", \"message\": \"Test\", \"contractorName\": \"Test\"}' https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/send_text"
echo ""
echo "Make sure your Twilio credentials are properly configured in your backend/.env file"
echo "or in your Firebase environment configuration."