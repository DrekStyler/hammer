import { writeBatch, doc } from "firebase/firestore";
import { db } from "./config";

export const batchUpdate = async (operations) => {
    const batch = writeBatch(db);

    operations.forEach(op => {
        if (op.type === 'set') {
            batch.set(doc(db, op.collection, op.id), op.data, { merge: op.merge || false });
        } else if (op.type === 'update') {
            batch.update(doc(db, op.collection, op.id), op.data);
        } else if (op.type === 'delete') {
            batch.delete(doc(db, op.collection, op.id));
        }
    });

    return await batch.commit();
};

// Example usage:
// import { batchUpdate } from '../firebase/batchOperations';
//
// const operations = [
//   { type: 'update', collection: 'users', id: userId, data: {...} },
//   { type: 'set', collection: 'projects', id: projectId, data: {...}, merge: true }
// ];
//
// await batchUpdate(operations);