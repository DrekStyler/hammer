# Handy Pro

A platform for contractors and project management.

## Environment Setup

This project uses environment variables for all sensitive information. Follow these steps to set up your environment:

### Frontend Environment Variables

1. Navigate to the frontend directory: `cd frontend/my-app`
2. Copy the template file: `cp .env.template .env`
3. Edit the `.env` file and fill in your Firebase configuration values:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### Backend Environment Variables

1. Navigate to the backend directory: `cd backend`
2. Copy the template file: `cp .env.template .env`
3. Edit the `.env` file and fill in your Twilio and Firebase credentials:

```
# Twilio Credentials
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid

# Firebase Admin SDK (JSON string of your serviceAccountKey.json)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

For the `FIREBASE_SERVICE_ACCOUNT` variable, you have two options:

- Convert your serviceAccountKey.json file to a single-line JSON string and use that
- Continue using the serviceAccountKey.json file (not recommended for production)

To convert your serviceAccountKey.json to a string:

```bash
cat serviceAccountKey.json | tr -d '\n' | tr -d ' '
```

### Production Environment

For production deployment, make sure to set these environment variables in your hosting platform:

- For Firebase Functions, use:

  ```bash
  firebase functions:config:set twilio.account_sid="YOUR_SID" twilio.auth_token="YOUR_TOKEN" twilio.messaging_service_sid="YOUR_SERVICE_SID"
  firebase functions:config:set firebase.service_account="YOUR_JSON_STRING"
  ```

- For frontend deployment, set the environment variables in your CI/CD pipeline or hosting platform.

## Running the Application

### Frontend

```bash
cd frontend/my-app
npm install
npm run dev
```

### Backend

```bash
cd backend
# Activate your virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate
python -m uvicorn main:app --reload
```

## Deployment

Follow the deployment instructions in the project documentation for deploying to Firebase Hosting and Functions.
