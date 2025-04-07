import time
import schedule
import threading
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from firebase_functions import https_fn, scheduler_fn
from firebase_admin import initialize_app, firestore

from .database import SessionLocal
from .twilio_service import twilio_service
from . import models

# Initialize Firebase app if not already initialized
try:
    app = initialize_app()
except ValueError:
    # App already initialized
    pass

def get_db():
    """Get a database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()

def check_upcoming_projects():
    """
    Check for projects starting within the next 24 hours and send notifications
    """
    print(f"Running upcoming projects check at {datetime.now()}")
    db = get_db()

    # Calculate the date range for projects starting in 24 hours
    tomorrow = datetime.now() + timedelta(days=1)
    start_of_tomorrow = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 0, 0, 0)
    end_of_tomorrow = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 23, 59, 59)

    # Query for projects starting tomorrow
    upcoming_projects = db.query(models.Project).filter(
        models.Project.status == "in_progress",
        models.Project.created_at >= start_of_tomorrow,
        models.Project.created_at <= end_of_tomorrow
    ).all()

    print(f"Found {len(upcoming_projects)} projects starting tomorrow")

    for project in upcoming_projects:
        # For each project, get assigned contractors
        # This will need to be adjusted based on your actual data model
        # Assuming there's a many-to-many relationship between projects and contractors
        # You'll need to modify this based on your actual database schema
        assigned_contractors = []

        # Example of a relationship that might exist
        # assigned_contractors = db.query(models.User).join(
        #     models.project_contractors,
        #     models.User.id == models.project_contractors.c.contractor_id
        # ).filter(
        #     models.project_contractors.c.project_id == project.id
        # ).all()

        # If no relationship is defined yet, this is a placeholder to retrieve all contractors
        # Modify this based on your actual data model
        assigned_contractors = db.query(models.User).filter(
            models.User.user_type == "SUBCONTRACTOR"
        ).all()

        print(f"Project '{project.title}' has {len(assigned_contractors)} assigned contractors")

        # Send notifications to each contractor
        for contractor in assigned_contractors:
            twilio_service.notify_contractor_for_project(db, contractor.id, project)

# Function to run the scheduler in the background
def run_scheduler():
    """Run the scheduler in a background thread"""
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

# Schedule the job to run daily
schedule.every().day.at("00:00").do(check_upcoming_projects)

# For Firebase Functions scheduled jobs (Cloud Functions)
@scheduler_fn.on_schedule(schedule="every 24 hours")
def scheduled_project_notifications(event: scheduler_fn.ScheduledEvent) -> None:
    """Firebase scheduled function to send notifications for upcoming projects"""
    check_upcoming_projects()
    return None

# For HTTP triggered notification check (manual trigger or testing)
@https_fn.on_request()
def check_notifications(req: https_fn.Request) -> https_fn.Response:
    """HTTP endpoint to manually trigger notifications check"""
    check_upcoming_projects()
    return https_fn.Response("Notifications check completed")

# Start the scheduler in a background thread if running directly
# This is for local testing - Cloud Functions will use the decorated functions
if __name__ == "__main__":
    scheduler_thread = threading.Thread(target=run_scheduler)
    scheduler_thread.daemon = True
    scheduler_thread.start()

    # Keep the main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Scheduler stopped")