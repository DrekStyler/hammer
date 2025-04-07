from twilio.rest import Client
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from . import models

# Twilio credentials from environment variables
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_MESSAGING_SERVICE_SID = os.environ.get('TWILIO_MESSAGING_SERVICE_SID')

class TwilioService:
    """Service to handle Twilio SMS notifications"""

    def __init__(self):
        """Initialize the Twilio client with credentials"""
        if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID]):
            print("Warning: Twilio credentials not fully configured in environment variables")
        self.client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    def send_message(self, to_number: str, message: str) -> str:
        """
        Send an SMS message using Twilio

        Args:
            to_number: The recipient's phone number (format: +1XXXXXXXXXX)
            message: The message content

        Returns:
            The message SID if successful
        """
        try:
            message = self.client.messages.create(
                messaging_service_sid=TWILIO_MESSAGING_SERVICE_SID,
                body=message,
                to=to_number
            )
            return message.sid
        except Exception as e:
            print(f"Error sending SMS: {str(e)}")
            raise e

    def format_project_message(self, project, contractor_name: str) -> str:
        """
        Format the project details message

        Args:
            project: The project object
            contractor_name: The contractor's name

        Returns:
            Formatted message with project details
        """
        message = f"Hello {contractor_name},\n\n"
        message += f"Reminder: You have a project scheduled to start tomorrow.\n\n"
        message += f"Project: {project.title}\n"
        message += f"Location: {project.location}\n"

        if hasattr(project, 'description') and project.description:
            message += f"Details: {project.description}\n"

        if hasattr(project, 'clientName') and project.clientName:
            message += f"Client: {project.clientName}\n"

        message += "\nPlease contact your project manager if you have any questions."

        return message

    def notify_contractor_for_project(self, db: Session, contractor_id: str, project) -> bool:
        """
        Send a notification to a contractor about an upcoming project

        Args:
            db: Database session
            contractor_id: The contractor's ID
            project: The project details

        Returns:
            True if notification was sent successfully
        """
        # Retrieve contractor details from database
        contractor = db.query(models.User).filter(models.User.id == contractor_id).first()

        if not contractor or not contractor.phone:
            print(f"Cannot send notification: Contractor {contractor_id} not found or no phone number")
            return False

        # Format the phone number for Twilio (add +1 if needed)
        phone = contractor.phone
        if not phone.startswith('+'):
            phone = '+1' + phone.replace('-', '').replace(' ', '')

        # Format the message
        message = self.format_project_message(project, f"{contractor.first_name} {contractor.last_name}")

        # Send the message
        try:
            message_sid = self.send_message(phone, message)
            print(f"Notification sent to {contractor.first_name} {contractor.last_name} ({phone}) - SID: {message_sid}")
            return True
        except Exception as e:
            print(f"Failed to send notification: {str(e)}")
            return False

# Create a singleton instance
twilio_service = TwilioService()