from firebase_admin import firestore

db = firestore.client()

# Example: Get all documents from a collection
docs = db.collection('users').get()
for doc in docs:
    print(f'{doc.id} => {doc.to_dict()}')