from firebase_admin import firestore
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

class FirebaseAdapter:
    """Adapter to interact with Firebase Firestore"""

    def __init__(self):
        """Initialize the Firestore client"""
        self.db = firestore.client()

    def get_projects_starting_tomorrow(self) -> List[Dict[str, Any]]:
        """
        Get projects that are starting tomorrow

        Returns:
            List of project documents
        """
        # Calculate tomorrow's date
        tomorrow = datetime.now() + timedelta(days=1)
        tomorrow_str = tomorrow.strftime('%Y-%m-%d')

        # Query Firestore for projects with startDate matching tomorrow
        projects_ref = self.db.collection('projects')
        query = projects_ref.where('startDate', '==', tomorrow_str)

        # Execute query
        projects = []
        for doc in query.stream():
            project_data = doc.to_dict()
            project_data['id'] = doc.id
            projects.append(project_data)

        return projects

    def get_contractor_by_id(self, contractor_id: str) -> Optional[Dict[str, Any]]:
        """
        Get contractor data by ID

        Args:
            contractor_id: The contractor's document ID

        Returns:
            Contractor document or None if not found
        """
        doc_ref = self.db.collection('contractors').document(contractor_id)
        doc = doc_ref.get()

        if doc.exists:
            contractor_data = doc.to_dict()
            contractor_data['id'] = doc.id
            return contractor_data

        return None

    def get_contractors_for_project(self, project_id: str) -> List[Dict[str, Any]]:
        """
        Get contractors assigned to a project

        Args:
            project_id: The project's document ID

        Returns:
            List of contractor documents
        """
        # This implementation assumes there's a 'contractors' field in the project
        # document that contains an array of contractor IDs
        # Adjust based on your actual data model

        project_ref = self.db.collection('projects').document(project_id)
        project = project_ref.get()

        contractors = []
        if project.exists:
            project_data = project.to_dict()

            # If the project has assigned contractors
            if 'contractors' in project_data and project_data['contractors']:
                for contractor_id in project_data['contractors']:
                    contractor = self.get_contractor_by_id(contractor_id)
                    if contractor:
                        contractors.append(contractor)

        return contractors

    def log_notification(self, project_id: str, contractor_id: str, message_sid: str, status: str = 'sent') -> str:
        """
        Log a notification in Firestore

        Args:
            project_id: The project's document ID
            contractor_id: The contractor's document ID
            message_sid: The Twilio message SID
            status: The notification status

        Returns:
            The ID of the created notification document
        """
        notifications_ref = self.db.collection('notifications')

        notification_data = {
            'project_id': project_id,
            'contractor_id': contractor_id,
            'message_sid': message_sid,
            'status': status,
            'timestamp': firestore.SERVER_TIMESTAMP
        }

        doc_ref = notifications_ref.add(notification_data)
        return doc_ref[1].id

# Create a singleton instance
firebase_adapter = FirebaseAdapter()