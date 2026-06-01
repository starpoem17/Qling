import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import type { User as FirebaseUser } from 'firebase/auth';

export function useTotalUnreadCount(user: FirebaseUser | null) {
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setTotalUnread(0);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let count = 0;
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          if (data.status === 'active' && data.unreadCounts?.[user.uid]) {
            count += data.unreadCounts[user.uid];
          }
        }
        setTotalUnread(count);
      },
      (err) => {
        console.error('Failed to load global unread count:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return totalUnread;
}
