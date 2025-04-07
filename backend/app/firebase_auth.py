import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import json

# Check for environment variable first, then fallback to file
firebase_credentials = os.environ.get('FIREBASE_SERVICE_ACCOUNT')

if firebase_credentials:
    # Parse the JSON string from environment variable
    try:
        cred_dict = json.loads(firebase_credentials)
        cred = credentials.Certificate(cred_dict)
        print("Using Firebase credentials from environment variable")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing Firebase credentials from environment: {e}")
        raise
else:
    # Fallback to file-based credentials
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level to the backend directory
    backend_dir = os.path.dirname(os.path.dirname(current_dir))
    # Path to the service account key
    cred_path = os.path.join(backend_dir, 'serviceAccountKey.json')

    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        print("Using Firebase credentials from serviceAccountKey.json file")
    else:
        raise FileNotFoundError(f"Firebase credentials not found in environment or at {cred_path}")

# Initialize Firebase Admin with credentials
firebase_admin.initialize_app(cred)

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        decoded_token = auth.verify_id_token(credentials.credentials)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {e}"
        )