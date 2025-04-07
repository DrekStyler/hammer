# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn, scheduler_fn
from firebase_admin import initialize_app
from app.notification_scheduler import scheduled_project_notifications, check_notifications
from twilio.rest import Client
import os
import json
from dotenv import load_dotenv
from app.twilio_service import twilio_service

# Load environment variables from .env file
load_dotenv()

# Initialize Firebase app
try:
    initialize_app()
except ValueError:
    # App already initialized
    pass

# Simple health check endpoint
@https_fn.on_request()
def hello_world(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response("Hello from Firebase Functions!")

# Test Twilio endpoint for sending a test message
@https_fn.on_request()
def test_twilio(req: https_fn.Request) -> https_fn.Response:
    try:
        # Get the phone number from the request or use a default
        phone_number = req.args.get('phone', '+1234567890')  # Placeholder phone number

        # Setup Twilio client
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        messaging_service_sid = os.environ.get('TWILIO_MESSAGING_SERVICE_SID')

        if not all([account_sid, auth_token, messaging_service_sid]):
            return https_fn.Response("Twilio credentials not properly configured", status=500)

        client = Client(account_sid, auth_token)

        # Send the message
        message = client.messages.create(
            messaging_service_sid=messaging_service_sid,
            body='Test message from Handy App!',
            to=phone_number
        )

        return https_fn.Response(f"Message sent! SID: {message.sid}")
    except Exception as e:
        return https_fn.Response(f"Error sending message: {str(e)}", status=500)

# Endpoint to send a text message to a contractor
@https_fn.on_request(cors=True)
def send_text(req: https_fn.Request) -> https_fn.Response:
    # Handle preflight requests for CORS
    if req.method == 'OPTIONS':
        # Set CORS headers for preflight requests
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return https_fn.Response('', status=204, headers=headers)

    # Only allow POST requests
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({"error": "Only POST method is allowed"}),
            status=405,
            headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}
        )

    try:
        # Get request body
        request_data = req.get_json()

        # Validate request data
        if not request_data:
            return https_fn.Response(
                json.dumps({"error": "No request data provided"}),
                status=400,
                headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}
            )

        phone_number = request_data.get('phoneNumber')
        message = request_data.get('message', 'Hey')
        contractor_name = request_data.get('contractorName', 'Contractor')

        if not phone_number:
            return https_fn.Response(
                json.dumps({"error": "Phone number is required"}),
                status=400,
                headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}
            )

        # Format the phone number for Twilio (add +1 if needed)
        if not phone_number.startswith('+'):
            phone_number = '+1' + phone_number.replace('-', '').replace(' ', '')

        # Format message if needed
        formatted_message = f"Hello {contractor_name}, {message}"

        # Send the message using our Twilio service
        message_sid = twilio_service.send_message(phone_number, formatted_message)

        # Return success response
        return https_fn.Response(
            json.dumps({
                "success": True,
                "message": "Text message sent successfully",
                "sid": message_sid
            }),
            headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}
        )
    except Exception as e:
        print(f"Error sending text message: {str(e)}")
        return https_fn.Response(
            json.dumps({"error": str(e)}),
            status=500,
            headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}
        )

# Import the scheduled function (it will be registered by the decorator)
# scheduled_project_notifications comes from app/notification_scheduler.py
# check_notifications comes from app/notification_scheduler.py