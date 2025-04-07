# Handy App Deployment Guide

This document explains how to deploy the Handy App, including both frontend and backend components, with special attention to the Twilio integration for text messaging.

## Prerequisites

Before deploying, make sure you have:

1. Node.js and npm installed
2. Python 3.8+ installed
3. Firebase CLI installed (`npm install -g firebase-tools`)
4. Firebase account with a project set up
5. Twilio account with proper credentials

## Environment Setup

### Twilio Credentials

The application requires three Twilio credentials to function properly:

1. `TWILIO_ACCOUNT_SID` - Your Twilio account SID
2. `TWILIO_AUTH_TOKEN` - Your Twilio authentication token
3. `TWILIO_MESSAGING_SERVICE_SID` - Your Twilio messaging service SID

These credentials need to be available to the backend. You have three options:

1. **Environment File (Recommended for Development):**

   - Create a `.env` file in the `backend/` directory
   - Include your credentials in this format:
     ```
     TWILIO_ACCOUNT_SID=your_account_sid
     TWILIO_AUTH_TOKEN=your_auth_token
     TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
     ```
   - This file is gitignored to prevent accidental commit of credentials

2. **Firebase Environment Variables (Recommended for Production):**

   - Set environment variables using the Firebase CLI:
     ```bash
     firebase functions:config:set twilio.account_sid=your_account_sid twilio.auth_token=your_auth_token twilio.messaging_service_sid=your_messaging_service_sid
     ```

3. **System Environment Variables:**
   - Export variables in your shell:
     ```bash
     export TWILIO_ACCOUNT_SID=your_account_sid
     export TWILIO_AUTH_TOKEN=your_auth_token
     export TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
     ```

## Deployment Methods

### Automatic Deployment

For convenience, we've created a deployment script that handles the entire process:

```bash
./deploy.sh
```

This script will:

1. Build the frontend
2. Set up the backend environment
3. Deploy all Firebase resources (Functions, Hosting, Firestore, Storage)
4. Provide testing instructions

### Manual Deployment

If you prefer to deploy components individually:

#### Frontend Deployment

```bash
cd frontend/my-app
npm install
npm run build
firebase deploy --only hosting
```

#### Backend/Functions Deployment

```bash
cd backend
# Install dependencies if needed
pip install -r requirements.txt
# Deploy functions
firebase deploy --only functions
```

## Testing the Deployment

### Testing the Web Application

1. After deployment, visit your Firebase Hosting URL (shown in the deployment output)
2. Log in to the application
3. Navigate to a contractor's detail page
4. Use the "Send Text" button next to the contractor's phone number

### Testing the Twilio Integration Directly

You can test the Twilio function directly using curl:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1XXXXXXXXXX", "message": "Test", "contractorName": "Test Contractor"}' \
  https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/send_text
```

Replace:

- `+1XXXXXXXXXX` with a valid phone number
- `YOUR-PROJECT-ID` with your Firebase project ID

## Development vs. Production Environment

The application has built-in logic to handle different environments:

- **Development (localhost):** When running locally, the "Send Text" button will simulate sending a message without making actual API calls to Twilio
- **Production:** In a production environment, the button will make actual calls to the Firebase function, which will use Twilio to send real text messages

## Troubleshooting

### 404 Error When Calling the Function

If you receive a 404 error when attempting to send a text message, it likely means:

1. The function hasn't been deployed yet
2. The function name is incorrect
3. You're using an incorrect URL

Solution: Verify that the function is properly deployed using:

```bash
firebase deploy --only functions
```

### "Failed to send text message: 500"

This typically indicates an issue with your Twilio credentials. Check:

1. Your credentials are correctly set in the environment
2. Your Twilio account is active and has proper permissions
3. Your Twilio messaging service is properly configured

### CORS Issues

If you're experiencing CORS errors:

1. Verify the function has `cors=True` in the decorator
2. Check that proper CORS headers are being returned
3. Ensure the frontend is using the correct URL format

## Monitoring

Once deployed, you can monitor your application using:

1. **Firebase Console:** View logs, function executions, and error reports
2. **Twilio Console:** Check message delivery status and any Twilio-specific errors
