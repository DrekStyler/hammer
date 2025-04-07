#!/usr/bin/env python3
"""
Test script for Twilio integration
Usage: python test_twilio.py [phone_number]
If no phone number is provided, a default number will be used.
"""

import sys
from twilio.rest import Client
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def main():
    # Get phone number from command line or use default
    if len(sys.argv) > 1:
        phone_number = sys.argv[1]
    else:
        phone_number = "+18777804236"  # Default phone number

    # Twilio credentials from environment variables
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    messaging_service_sid = os.environ.get('TWILIO_MESSAGING_SERVICE_SID')

    # Check if credentials are set
    if not all([account_sid, auth_token, messaging_service_sid]):
        print("Error: Twilio credentials not properly configured in environment variables")
        print("Make sure you have a .env file with the required Twilio credentials")
        return 1

    print(f"Using account SID: {account_sid}")
    print(f"Using messaging service SID: {messaging_service_sid}")
    print(f"Sending test message to: {phone_number}")

    # Initialize Twilio client
    client = Client(account_sid, auth_token)

    try:
        # Send a test message
        message = client.messages.create(
            messaging_service_sid=messaging_service_sid,
            body='This is a test message from the Handy App',
            to=phone_number
        )

        print(f"Message sent successfully!")
        print(f"Message SID: {message.sid}")
        print(f"Message status: {message.status}")
        return 0
    except Exception as e:
        print(f"Error sending message: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())