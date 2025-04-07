# Twilio Integration for Contractor Notifications

This integration allows the Handy app to send SMS notifications to contractors 24 hours before their projects start, providing them with important project details.

## Setup

### 1. Environment Variables

There are several ways to set the required Twilio credentials:

#### Using a .env file (recommended):

Create a `.env` file in the backend directory with the following content:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
```

A template file (`.env.template`) is provided for reference. Simply copy it to `.env` and add your Twilio credentials.

#### Using system environment variables:

```bash
export TWILIO_ACCOUNT_SID=your_account_sid
export TWILIO_AUTH_TOKEN=your_auth_token
export TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
```

#### Using Firebase environment configuration:

```bash
firebase functions:config:set twilio.account_sid=your_account_sid twilio.auth_token=your_auth_token twilio.messaging_service_sid=your_messaging_service_sid
```

### 2. Dependencies

Install the required Python packages:

```bash
pip install -r requirements.txt
```

### 3. Testing the Integration

You can test the Twilio integration using the included test script:

```bash
python test_twilio.py [optional_phone_number]
```

If you don't provide a phone number, it will use the default number.

## How It Works

### Scheduled Notifications

The system uses Firebase Cloud Functions to check for projects starting in the next 24 hours and sends SMS notifications to assigned contractors. The process works as follows:

1. A scheduled function runs once daily to check for projects starting tomorrow
2. For each project found, it identifies the assigned contractors
3. Each contractor receives an SMS with details about the project
4. Notification logs are saved to Firestore

### Message Format

The notification includes:

- Project title
- Location
- Description (if available)
- Client name (if available)
- Contact instructions

### Manual Testing

You can manually trigger the notification check using an HTTP request to the `check_notifications` endpoint:

```bash
curl https://your-firebase-project.web.app/check_notifications
```

## Firebase Functions

The integration includes three Firebase Functions:

1. `scheduled_project_notifications` - A scheduled function that runs every 24 hours
2. `check_notifications` - An HTTP endpoint for manual testing
3. `send_text` - An HTTP endpoint for sending direct text messages to contractors

## Customization

### Message Template

To customize the message content, modify the `format_project_message` method in `app/twilio_service.py`.

### Notification Schedule

To change when notifications are sent, modify the schedule setting in `app/notification_scheduler.py`. The default is 24 hours before project start.

## Troubleshooting

### Common Issues

1. **No messages being sent**:

   - Verify environment variables are set correctly
   - Check that projects have correct start dates
   - Make sure contractors have valid phone numbers

2. **Error: Invalid phone number**:

   - Ensure phone numbers are in E.164 format (e.g., +1XXXXXXXXXX)
   - The system attempts to format numbers automatically, but may fail with unusual formats

3. **Error: Twilio authentication failed**:
   - Double-check your Twilio credentials

### Logs

You can view logs in the Firebase console to diagnose issues with the notification system.

## Deployment

To deploy the Firebase Functions, follow these steps:

1. Make sure you have the Firebase CLI installed:

   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```bash
   firebase login
   ```

3. Initialize Firebase (if not already done):

   ```bash
   firebase init
   ```

   Select "Functions" when prompted for features to set up.

4. Deploy the functions:

   ```bash
   firebase deploy --only functions
   ```

5. Verify deployment:
   After deployment completes, you should see URLs for each function, like:

   ```
   Function URL (send_text): https://us-central1-handypro-a58a7.cloudfunctions.net/send_text
   ```

6. Test the deployed function:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"phoneNumber": "+1XXXXXXXXXX", "message": "Test", "contractorName": "Test Contractor"}' https://us-central1-handypro-a58a7.cloudfunctions.net/send_text
   ```

If you encounter a 404 error when trying to access the function, make sure:

- The function has been properly deployed
- You're using the correct URL
- The function name matches exactly in the code and URL (Firebase uses underscores in function names)
