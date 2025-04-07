import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useFirestoreQuery(collectionName, queryConstraints = [], options = {}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);

        const collectionRef = collection(db, collectionName);
        const q = query(collectionRef, ...queryConstraints);

        // Use realtime updates if specified in options
        if (options.realtime) {
            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    const results = [];
                    snapshot.forEach(doc => {
                        results.push({ id: doc.id, ...doc.data() });
                    });
                    setData(results);
                    setLoading(false);
                    setError(null);
                },
                (err) => {
                    console.error(`Error in ${collectionName} query:`, err);
                    setError(err);
                    setLoading(false);
                }
            );

            return () => unsubscribe();
        } else {
            // One-time fetch
            getDocs(q)
                .then((snapshot) => {
                    const results = [];
                    snapshot.forEach(doc => {
                        results.push({ id: doc.id, ...doc.data() });
                    });
                    setData(results);
                    setError(null);
                })
                .catch((err) => {
                    console.error(`Error in ${collectionName} query:`, err);
                    setError(err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [collectionName, JSON.stringify(queryConstraints), options.realtime]);

    return { data, loading, error };
}

// Example usage in a component:
//
// import { where, orderBy, limit } from 'firebase/firestore';
// import { useFirestoreQuery } from '../hooks/useFirestore';
//
// function ProjectList() {
//   const { data: projects, loading, error } = useFirestoreQuery(
//     'projects',
//     [
//       where('status', '!=', 'cancelled'),
//       orderBy('status'),
//       orderBy('createdAt', 'desc'),
//       limit(20)
//     ],
//     { realtime: true }
//   );
//
//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>Error: {error.message}</div>;
//
//   return (
//     <div>
//       {projects.map(project => (
//         <ProjectCard key={project.id} project={project} />
//       ))}
//     </div>
//   );
// }